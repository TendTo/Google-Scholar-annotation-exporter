import { loadConfiguration, type Format, type Paper } from "./data";
import Handlebars from "handlebars/runtime";
import MarkdownTemplate from "./templates/md.hbs.js";
import JsonTemplate from "./templates/json.hbs.js";
import CsvTemplate from "./templates/csv.hbs.js";
import LaTexTemplate from "./templates/tex.hbs.js";
import { ProcessTemplateRequest, sendMessage } from "./message";
import { i18n } from "./i18";

function escapeDoubleQuotes(text: string) {
  if (typeof text !== "string") return text;
  return text.replaceAll('"', '\\"');
}

function escapePipe(text: string) {
  if (typeof text !== "string") return text;
  return text.replaceAll("|", "\\|");
}

function escapeTex(text: string) {
  if (typeof text !== "string") return text;
  const specialChars = {
    "#": "\\#",
    $: "\\$",
    "%": "\\%",
    "&": "\\&",
    _: "\\_",
    "{": "\\{",
    "}": "\\}",
    "~": "\\textasciitilde{}",
    "^": "\\textasciicircum{}",
    "\\": "\\textbackslash{}",
  };
  return text.replace(
    /[#\$%&_{}~^\\]/g,
    (match) => specialChars[match as keyof typeof specialChars],
  );
}

export abstract class Exporter {
  static getExporter(format: Format): Exporter {
    switch (format) {
      case "Markdown":
        return new MarkdownExporter();
      case "JSON":
        return new JSONExporter();
      case "CSV":
        return new CSVExporter();
      case "LaTex":
        return new LaTexExporter();
      case "Custom":
        return new CustomExporter();
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  getContext(papers: Paper[]): Record<string, any> {
    return {
      extension: chrome.runtime.getManifest().name,
      extensionHomepage: chrome.runtime.getManifest().homepage_url,
      extensionVersion: chrome.runtime.getManifest().version,
      exportDate: new Date().toISOString(),
      numberOfPapers: papers.length,
      numberOfAnnotations: papers.reduce((sum, paper) => sum + paper.annotations.length, 0),
      papers,
    };
  }

  async export(papers: Paper[]): Promise<string> {
    return this.template(this.getContext(papers));
  }

  abstract get fileExtension(): string;
  abstract get mimeType(): string;
  abstract get template(): Handlebars.TemplateDelegate;

  async download(content: string | Paper[], filename: string = "") {
    if (Array.isArray(content)) content = await this.export(content);

    if (!content) {
      console.warn("No content to export. Aborting download.");
      return;
    }

    const blob = new Blob([content], { type: this.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Google_Scholar_annotations_${new Date().toISOString().split("Z")[0]}.${this.fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

class MarkdownExporter extends Exporter {
  private static _template: Handlebars.TemplateDelegate | null = null;

  get template(): Handlebars.TemplateDelegate {
    if (!MarkdownExporter._template) {
      MarkdownExporter._template = Handlebars.template(MarkdownTemplate);
      if (!("escapePipe" in Handlebars.helpers)) {
        Handlebars.registerHelper("escapePipe", escapePipe);
      }
    }
    return MarkdownExporter._template;
  }

  get fileExtension(): string {
    return "md";
  }

  get mimeType(): string {
    return "text/markdown";
  }
}

class JSONExporter extends Exporter {
  private static _template: Handlebars.TemplateDelegate | null = null;

  get template(): Handlebars.TemplateDelegate {
    if (!JSONExporter._template) {
      JSONExporter._template = Handlebars.template(JsonTemplate);
      if (!("escapeDoubleQuotes" in Handlebars.helpers)) {
        Handlebars.registerHelper("escapeDoubleQuotes", escapeDoubleQuotes);
      }
    }
    return JSONExporter._template;
  }

  get fileExtension(): string {
    return "json";
  }

  get mimeType(): string {
    return "application/json";
  }
}

class CSVExporter extends Exporter {
  private static _template: Handlebars.TemplateDelegate | null = null;

  get template(): Handlebars.TemplateDelegate {
    if (!CSVExporter._template) {
      CSVExporter._template = Handlebars.template(CsvTemplate);
      if (!("escapeDoubleQuotes" in Handlebars.helpers)) {
        Handlebars.registerHelper("escapeDoubleQuotes", escapeDoubleQuotes);
      }
    }
    return CSVExporter._template;
  }

  get fileExtension(): string {
    return "csv";
  }

  get mimeType(): string {
    return "text/csv";
  }
}

class LaTexExporter extends Exporter {
  private static _template: Handlebars.TemplateDelegate | null = null;

  get template(): Handlebars.TemplateDelegate {
    if (!LaTexExporter._template) {
      LaTexExporter._template = Handlebars.template(LaTexTemplate);
      if (!("escapeTex" in Handlebars.helpers)) {
        Handlebars.registerHelper("escapeTex", escapeTex);
      }
    }
    return LaTexExporter._template;
  }

  get fileExtension(): string {
    return "tex";
  }

  get mimeType(): string {
    return "application/x-tex";
  }
}

class CustomExporter extends Exporter {
  get template(): Handlebars.TemplateDelegate {
    throw new Error("CustomExporter template cannot be used directly.");
  }

  async export(papers: Paper[]): Promise<string> {
    const { customExportTemplate } = await loadConfiguration();
    if (!customExportTemplate) {
      alert(i18n("export_no_template"));
      return "";
    }
    const {
      data: { error, result },
    } = await sendMessage<ProcessTemplateRequest>({
      data: { template: customExportTemplate, context: this.getContext(papers) },
      type: "processTemplate",
    });

    if (error) {
      console.error("Error processing template:", error);
      return "";
    }
    return result;
  }

  get fileExtension(): string {
    return "txt";
  }

  get mimeType(): string {
    return "text/plain";
  }
}
