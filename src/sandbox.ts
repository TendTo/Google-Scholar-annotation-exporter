import Handlebars from "handlebars";
import { type ProcessTemplateRequest } from "./message";

function processTemplate(request: ProcessTemplateRequest): string {
  const compiledTemplate = Handlebars.compile(request.data.template);
  return compiledTemplate(request.data.context);
}

window.addEventListener("message", function (event: MessageEvent<ProcessTemplateRequest>) {
  const data = { result: "", error: "" };
  try {
    switch (event.data.type) {
      case "processTemplate":
        data.result = processTemplate(event.data);
        break;
      default:
        data.error = `Unknown request type: ${event.data.type}`;
    }
  } catch (error) {
    data.error = `Error processing template: ${error}`;
  }
  if (event.source && event.origin) {
    event.source.postMessage({ data }, event.origin as any);
  }
});
