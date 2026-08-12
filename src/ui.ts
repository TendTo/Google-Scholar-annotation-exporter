import { batchCollect } from "./collect";
import {
  CITATION_STYLES,
  type Configuration,
  EXPORT_FORMATS,
  loadConfiguration,
  loadState,
  resetConfiguration,
  resetData,
  resetState,
  updateConfiguration,
  updateState,
} from "./data";
import { ConfigurationChanged, ExportEnd } from "./event";
import { i18n } from "./i18";
import toolbarHtml from "./toolbar.html?raw";

const selectors = [
  ".gs-aex-checkbox[gs-aex-article]",
  "#gs-aex-select-all",
  "#gs-aex-deselect-all",
  "#gs-aex-reset",
  "#gs-aex-advanced-options",
  "#gs-hlt-style",
  "#gs-hlt-format",
  "#gs-aex-export-all.gs-aex-start",
  "#gs-aex-export-selected",
];
function toggleDisableAllInputs(disable: boolean) {
  selectors.forEach((selector) => {
    document.querySelectorAll<HTMLInputElement | HTMLSelectElement>(selector).forEach((el) => {
      el.disabled = disable;
    });
  });
}

function updateExportAllButton(button: HTMLButtonElement | null, isMultipageExporting: boolean) {
  if (!button) return;
  button.textContent = isMultipageExporting ? i18n("stop_exporting") : i18n("export_all_pages");
  button.classList.toggle("gs-aex-stop", isMultipageExporting);
  button.classList.toggle("gs-aex-start", !isMultipageExporting);
}

export async function updateUI() {
  const { isMultipageExporting } = await loadState();

  // Add a checkbox to each entry in the search results
  document.querySelectorAll(".gs_r.gs_or.gs_scl").forEach((entry) => {
    if (entry.querySelector(".gs-aex-checkbox-wrap")) return;
    entry.classList.add("gs-aex-row");
    const wrap = document.createElement("div");
    wrap.className = "gs-aex-checkbox-wrap";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "gs-aex-checkbox";
    cb.setAttribute("gs-aex-article", "");
    if (isMultipageExporting) cb.checked = true;
    wrap.appendChild(cb);
    entry.prepend(wrap);
  });

  if (isMultipageExporting) {
    toggleDisableAllInputs(true);
  } else {
    toggleDisableAllInputs(false);
  }

  if (document.getElementById("gs-aex-toolbar")) return; // Avoid adding the action bar multiple times

  const configuration: Configuration = await loadConfiguration();

  // Action bar
  const toolBar = document.createElement("div");
  toolBar.id = "gs-aex-toolbar";
  toolBar.innerHTML = toolbarHtml.replace(/{{\s*(\w+)\s*}}/g, (_: string, key: string) =>
    i18n(key as keyof typeof i18n),
  );

  // 'Select all' Button
  toolBar.querySelector("#gs-aex-select-all")?.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      ".gs-aex-checkbox[gs-aex-article]",
    );
    const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
    checkboxes.forEach((cb) => (cb.checked = !allChecked));
  });

  // 'Deselect all' Button
  toolBar.querySelector("#gs-aex-deselect-all")?.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      ".gs-aex-checkbox[gs-aex-article]",
    );
    checkboxes.forEach((cb) => (cb.checked = false));
  });

  // 'Reset' Button
  toolBar.querySelector("#gs-aex-reset")?.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      ".gs-aex-checkbox[gs-aex-article]",
    );
    checkboxes.forEach((cb) => (cb.checked = false));
    resetData();
    resetState();
    resetConfiguration();
  });

  // 'Fetch Context' Checkbox
  const fetchContextCheckbox = toolBar.querySelector<HTMLInputElement>("#gs-aex-fetch-context")!;
  fetchContextCheckbox.checked = configuration.fetchContext;
  fetchContextCheckbox.addEventListener("change", (e) => {
    if (!e.target || !(e.target instanceof HTMLInputElement)) return;
    updateConfiguration({ fetchContext: e.target.checked });
  });

  // Citation Style Dropdown
  const styleSelect = toolBar.querySelector<HTMLSelectElement>("#gs-aex-cite-style")!;
  CITATION_STYLES.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    styleSelect.appendChild(opt);
  });
  styleSelect.value = configuration.citationStyle;
  styleSelect.addEventListener("change", (e) => {
    if (!e.target || !(e.target instanceof HTMLSelectElement)) return;
    updateConfiguration({ citationStyle: e.target.value as Configuration["citationStyle"] });
  });

  // Export Format Dropdown
  const formatSelect = toolBar.querySelector<HTMLSelectElement>("#gs-aex-export-format")!;
  EXPORT_FORMATS.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f;
    opt.textContent = f;
    formatSelect.appendChild(opt);
  });
  formatSelect.value = configuration.exportFormat;
  formatSelect.addEventListener("change", (e) => {
    if (!e.target || !(e.target instanceof HTMLSelectElement)) return;
    updateConfiguration({ exportFormat: e.target.value as Configuration["exportFormat"] });
  });

  // Advanced Options Modal
  const advancedButton = toolBar.querySelector<HTMLButtonElement>("#gs-aex-advanced-options")!;
  const advancedModal = toolBar.querySelector<HTMLDialogElement>("#gs-aex-advanced-modal")!;
  const exportTemplateTextarea =
    toolBar.querySelector<HTMLTextAreaElement>("#gs-aex-export-template")!;
  const saveAdvancedButton = toolBar.querySelector<HTMLButtonElement>("#gs-aex-save-advanced")!;
  const cancelAdvancedButton = toolBar.querySelector<HTMLButtonElement>("#gs-aex-cancel-advanced")!;

  exportTemplateTextarea.value = configuration.customExportTemplate;

  advancedButton.addEventListener("click", async () => {
    const configuration = await loadConfiguration();
    exportTemplateTextarea.value = configuration.customExportTemplate;
    advancedModal.showModal();
  });

  saveAdvancedButton.addEventListener("click", () => {
    updateConfiguration({ customExportTemplate: exportTemplateTextarea.value });
    advancedModal.close();
  });

  cancelAdvancedButton.addEventListener("click", () => {
    advancedModal.close();
  });

  // Export Selected Button
  toolBar.querySelector("#gs-aex-export-selected")?.addEventListener("click", async () => {
    resetData();
    resetState();
    toggleDisableAllInputs(true);
    batchCollect(false);
  });

  // Export All Pages Button
  const exportAllBtn = toolBar.querySelector<HTMLButtonElement>("#gs-aex-export-all");
  updateExportAllButton(exportAllBtn, isMultipageExporting);
  exportAllBtn?.addEventListener("click", async () => {
    await fetch("/favicon.ico", { method: "HEAD" }); // Workaround for a bug in Chrome that prevents the extension from working on the first page load
    // Stop auto-export if already exporting
    if (isMultipageExporting && confirm(i18n("export_stop_confirmation"))) {
      alert(i18n("export_stopped"));
      location.reload();
    } else if (!isMultipageExporting && confirm(i18n("export_all_confirmation"))) {
      // Start auto-export if not already exporting
      resetData();
      updateState({ isMultipageExporting: true });

      // Check if we need to go back to page 1
      const url = new URL(window.location.href);
      const start = url.searchParams.get("start");
      if (start && start !== "0") {
        url.searchParams.set("start", "0");
        window.location.href = url.toString();
        return;
      }

      document
        .querySelectorAll<HTMLInputElement>(".gs-aex-checkbox[gs-aex-article]")
        .forEach((cb) => {
          cb.checked = true;
        });

      // This must always come before `toggleDisableAllInputs`
      updateExportAllButton(exportAllBtn, true);
      toggleDisableAllInputs(true);
      batchCollect(true);
    }
  });

  // Event Listeners
  document.addEventListener(ConfigurationChanged.eventName, async (e) => {
    const newConfiguration = (e as ConfigurationChanged).detail;
    styleSelect.value = newConfiguration.citationStyle;
    formatSelect.value = newConfiguration.exportFormat;
    fetchContextCheckbox.checked = newConfiguration.fetchContext;
    exportTemplateTextarea.value = newConfiguration.customExportTemplate;
  });
  document.addEventListener(ExportEnd.eventName, () => {
    resetState();
    toggleDisableAllInputs(false);
    updateExportAllButton(document.querySelector("#gs-aex-export-all"), false);
  });

  const mainPanel =
    document.getElementById("gs_res_ccl_mid") || document.getElementById("gs-aex-main");
  if (!mainPanel) {
    console.error("Could not find main panel to insert toolbar");
    return;
  }
  mainPanel.prepend(toolBar);
}
