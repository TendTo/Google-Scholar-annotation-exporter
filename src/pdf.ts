import { getDocument, PDFDocumentProxy, TextItem, TextMarkedContent } from "pdfjs-serverless";
import type { Annotation, Paper } from "./data";
// import pdfTest from "../test/1col.txt?raw";

class CachedPages {
  private itemCache = new Map<number, string>();

  constructor(private pdfDocument: PDFDocumentProxy) {}

  static async fromData(data: Uint8Array) {
    return new CachedPages(await getDocument({ data }).promise);
  }

  private async cachePage(pageIdx: number) {
    const page = await this.pdfDocument.getPage(pageIdx);
    const content = await page.getTextContent();
    // Assume that items are sorted in the same way
    // the would be selected in the PDF viewer, so we can just join them together
    const textItems = content.items
      .filter((item): item is TextItem => "str" in item)
      .map((item) => ({ ...item, str: item.str.trim() }))
      .filter((item) => item.str.length > 0);

    for (let i = 0; i < textItems.length; i++) {
      const textItem = textItems[i];
      if (textItem.str.endsWith("-") && i + 1 < textItems.length) {
        const [_, __, ___, ____, x, y] = textItem.transform;
        const nextTextItem = textItems[i + 1];
        const [_____, ______, _______, ________, nx, ny] = nextTextItem.transform;
        if (Math.abs(y - ny) > 2) {
          // We always remove '-' if there is a new line
          textItems[i].str = textItem.str.substring(0, textItem.str.length - 1);
        }
      } else if (i + 1 < textItems.length) {
        textItems[i].str = textItems[i].str + " ";
      }
    }
    const lastTextItem = textItems.at(-1);
    if (lastTextItem?.str.endsWith("-") && (await this.get(pageIdx + 1))) {
      // We always remove '-' if there is a new line
      textItems.at(-1)!.str = lastTextItem.str.substring(0, lastTextItem.str.length - 1);
    }
    this.itemCache.set(pageIdx, textItems.map((item) => item.str).join(""));
  }

  public async get(pageIdx: number) {
    if (!this.itemCache.has(pageIdx) && pageIdx >= 1 && pageIdx <= this.pdfDocument.numPages) {
      // Make sure the page in in cache
      await this.cachePage(pageIdx);
    }
    return this.itemCache.get(pageIdx);
  }

  public async extractContext(text: string, pageIdx: number) {
    console.log("Extracting context for annotation '", text, "' on page ", pageIdx);
    const [prev, current, next] = await Promise.all([
      this.get(pageIdx - 1),
      this.get(pageIdx),
      this.get(pageIdx + 1),
    ]);
    const startText = (prev ?? "").concat(current ?? "").concat(next ?? "");
    const startIdx = startText.indexOf(text);
    // We know that the text starts on the current page.
    // If we can't find it, we return an empty string
    if (startIdx === -1) return "";

    // Otherwise, looking for the context, we prepend the previous page
    // since the sentence might have started there
    const contentText = (prev ?? "").concat(startText);
    let startContextIdx = startIdx + (prev ?? "").length;
    let endContextIdx = startIdx + (prev ?? "").length + text.length;
    for (; startContextIdx >= 0; startContextIdx--) {
      if (".!?".includes(contentText[startContextIdx])) break;
    }
    for (; endContextIdx < contentText.length; endContextIdx++) {
      if (".!?".includes(contentText[endContextIdx])) break;
    }
    startContextIdx = startContextIdx >= 0 ? startContextIdx + 1 : startContextIdx;
    endContextIdx = endContextIdx < contentText.length ? endContextIdx + 1 : endContextIdx;
    return contentText.substring(startContextIdx, endContextIdx).trim();
  }
}

export class PDFContextExtractor {
  constructor(private paper: Paper) {}

  async enrichPaper(): Promise<Paper> {
    // const pdf = await getDocument({ data: Uint8Array.fromBase64(pdfTest) }).promise;
    // console.log("PDF fetched successfully:", pdf);

    if (!this.paper.link) {
      console.warn("No PDF link available for this paper.");
      return this.paper;
    }

    let pdf: PDFDocumentProxy;
    try {
      console.log("Fetching PDF from link:", this.paper.link);
      pdf = await getDocument({ url: new URL(this.paper.link) }).promise;
      console.log("PDF fetched successfully:", pdf);
    } catch (error) {
      console.error("Error getting the PDF:", error);
      return this.paper;
    }

    const annotations = await this.enrichAnnotations(pdf);
    return { ...this.paper, annotations };
  }

  private async enrichAnnotations(pdf: PDFDocumentProxy): Promise<Annotation[]> {
    const pages = new CachedPages(pdf);
    return await Promise.all(
      this.paper.annotations.map(async (annotation) => {
        let context = "";
        try {
          context = await pages.extractContext(annotation.highlightText, annotation.page);
        } catch (error) {
          console.error(`Error extracting context for annotation ${annotation}:`, error);
        }
        return { ...annotation, context };
      }),
    );
  }
}
