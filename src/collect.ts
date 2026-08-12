import {
  COLOR_MAP,
  defaultPaper,
  loadConfiguration,
  loadData,
  resetData,
  updateData,
  type Annotation,
  type ColorIdx,
} from "./data";
import { ExportEnd } from "./event";
import { Exporter } from "./export";
import { i18n } from "./i18";
import { type EnrichPaperRequest, sendMessage } from "./message";
import { cleanInnerText, failedGSFetchText } from "./util";

const APARegex =
  /^(?<author>(?:[^\x00-\x7F]|[\w\s&.,'’"\-])(?:[\w\s&.,'’"\-]|[^\x00-\x7F])+)\((?<year>\d{4})[^)]*\)\.?\s*(?<title>.+?\.)/;

export async function batchCollect(isMultiPage = false) {
  try {
    if (await batchCollectImpl(isMultiPage)) {
      document.dispatchEvent(new ExportEnd()); // Notify UI to re-enable checkboxes
    }
  } catch (error) {
    console.error("Error during batch export:", error);
    document.dispatchEvent(new ExportEnd()); // Notify UI to re-enable checkboxes
    alert(i18n("collect_error_generic"));
  }
}

export async function batchCollectImpl(isMultiPage = false) {
  const checkboxes = document.querySelectorAll(".gs-aex-checkbox[gs-aex-article]:checked");
  if (checkboxes.length === 0) {
    alert(i18n("collect_error_no_papers_selected"));
    return true;
  }
  const { papers } = await loadData();
  const { citationStyle, exportFormat, fetchContext } = await loadConfiguration();

  const statusUI = document.getElementById("gs-aex-status") ?? document.createElement("div");

  const CONCURRENCY = 5; // User requested 5 specific (2 batches per page)

  let items = Array.from(checkboxes);
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const batch = items.slice(i, i + CONCURRENCY);
    const batchPromises = batch.map(async (checkbox, indexInBatch) => {
      const paper = defaultPaper();
      const entry = checkbox.closest(".gs_r");
      if (!entry) throw new Error("Checkbox not inside a .gs_r entry");
      const titleElement = entry.querySelector<HTMLAnchorElement>(".gs_rt");
      paper.title = titleElement
        ? titleElement.innerText.replace(/\[[A-Z]+\]\s*/g, "").trim()
        : i18n("untitled_paper");

      const baseIdx = papers.length + i * CONCURRENCY + indexInBatch;
      statusUI.textContent = i18n("status_exporting", [
        `${baseIdx + 1}`,
        `${baseIdx + batch.length}`,
      ]);

      const dataCid = entry.getAttribute("data-cid");
      const dataAid = entry.getAttribute("data-aid");

      try {
        // Fetch Citation and Annotations for this paper
        const citUrl = `/scholar?scila=${dataCid}&output=cite&hl=en`;
        const annUrl = dataAid
          ? `/citations?hl=en&view_op=list_highlights&citilm=1&citation_for_view=${dataAid}`
          : null;

        const [citPage, annPage] = await Promise.all([
          citUrl ? fetch(citUrl).then((r) => r.text()) : Promise.resolve(null),
          annUrl ? fetch(annUrl).then((r) => r.text()) : Promise.resolve(null),
        ]);

        // Check for CAPTCHA redirect or page
        if (failedGSFetchText(citPage) || failedGSFetchText(annPage)) {
          paper.captcha = true;
          return paper;
        }

        // Parse Citation
        const parser = new DOMParser();
        if (citPage) {
          const citeDoc = parser.parseFromString(citPage, "text/html");
          const rows = Array.from(citeDoc.querySelectorAll("tr"));
          const targetRow = rows.find((r) =>
            r.querySelector("th")?.innerText.includes(citationStyle),
          );
          if (targetRow) {
            paper.citation =
              targetRow.querySelector<HTMLTableCellElement>(".gs_citr")?.innerText.trim() ||
              paper.title;
          }
          const apaRow = rows.find((r) => r.querySelector("th")?.innerText.includes("APA"));
          if (apaRow) {
            const journal = apaRow
              .querySelector<HTMLTableCellElement>(".gs_citr i")
              ?.innerText.trim();
            let apaText = apaRow.querySelector<HTMLTableCellElement>(".gs_citr")?.innerText.trim();
            if (journal) paper.journal = journal;
            if (apaText) {
              if (journal) apaText = apaText.replace(journal, "").trim(); // Remove journal from APA text
              const match = apaText.match(APARegex);
              if (match && match.groups) {
                paper.authors = match.groups.author.trim();
                paper.year = match.groups.year;
                paper.title = match.groups.title.trim();
              }
            }
          }
        }

        // Parse Annotations
        if (annPage) {
          const hlDoc = parser.parseFromString(annPage, "text/html");

          // Metadata
          const paperInfo = hlDoc.querySelector(".gsc_hdb_cit_info");
          paper.link = hlDoc.querySelector<HTMLAnchorElement>(".gsc_hdb_url a")?.href || "";

          if (paperInfo) {
            paper.metadata = Array.from(
              hlDoc.querySelectorAll<HTMLTableCellElement>(".gsc_hdb_cit_meta"),
            )
              .map((m) => m.innerText.trim())
              .filter((m) => m);
          }

          // Annotations
          const annotationElements = Array.from(hlDoc.querySelectorAll(".gsc_hdb_hl"));
          let lastPage = 0;
          paper.annotations = annotationElements.map((al) => {
            const pageElement = cleanInnerText(".gsc_hdb_pn", al);
            lastPage = pageElement ? parseInt(pageElement.substring("Page ".length), 10) : lastPage;
            const highlightText = cleanInnerText(".gsc_hdb_hl_text", al);
            const note = cleanInnerText(".gsc_hdb_hl_comment", al);
            const highlightElement = al.querySelector(".gsc_hdb_hl_text");
            let highlightColorIdx: ColorIdx = "-1";
            for (const cls of Array.from(highlightElement?.classList || [])) {
              if (cls.startsWith("gsc_hdb_hl_color_")) {
                highlightColorIdx = cls.substring("gsc_hdb_hl_color_".length) as ColorIdx;
                break;
              }
            }
            return {
              highlightText,
              note,
              highlightColor: COLOR_MAP[highlightColorIdx],
              context: "",
              page: lastPage,
            } as Annotation;
          });
        }

        if (fetchContext) {
          const {
            data: { annotations },
          } = await sendMessage<EnrichPaperRequest>({ data: paper, type: "enrichPaper" });
          paper.annotations = annotations; // Update paper by enriching the annotations with context
        }
      } catch (err: any) {
        console.error(`Lightning error for ${paper.title}:`, err);
        paper.error = err.message || "Unknown error";
      }
      return paper;
    });

    const results = await Promise.all(batchPromises);

    // If any hit CAPTCHA, stop and alert
    if (results.some((r) => r.captcha)) {
      statusUI.textContent = i18n("status_captcha");
      alert(i18n("collect_error_captcha"));
      return true;
    }

    papers.push(...results);

    // Fixed sleep between batches
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const nextBtn = document.querySelector<HTMLAnchorElement>("#gs_n a:has(.gs_ico_nav_next)");
  if (isMultiPage && nextBtn) {
    updateData({ papers: papers });

    statusUI.textContent = i18n("status_next_page");
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait a second before navigating
    window.location.href = nextBtn.href;
    return false; // Prevent emitting the ExportEnd event until the next page is processed
  }

  const exporter = Exporter.getExporter(exportFormat);
  await exporter.download(papers);
  resetData(); // Reset data after export
  statusUI.textContent = i18n("status_exported", `${papers.length}`);

  return true; // Indicate that the export process is complete
}
