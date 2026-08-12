import {
  type Request,
  type ResponseCb,
  sendMessage,
  ProcessTemplateRequest,
  RequestProcessor,
} from "./message";
import { PDFContextExtractor } from "./pdf";

const processTemplate: RequestProcessor<ProcessTemplateRequest> = async (request) => {
  try {
    await chrome.offscreen.createDocument({
      url: "../assets/html/offscreen.html",
      reasons: ["IFRAME_SCRIPTING"],
      justification: "Running dynamic template processing via Handlebars.",
    });
    return await sendMessage(request);
  } catch (error) {
    console.error("Error occurred while processing template:", error);
    return { data: { result: "", error: `Error occurred while processing template: ${error}` } };
  } finally {
    await chrome.offscreen.closeDocument();
  }
};

chrome.runtime.onMessage.addListener(
  async (request: Request, sender, sendResponse: ResponseCb<Request>) => {
    switch (request.type) {
      case "enrichPaper":
        const extractor = new PDFContextExtractor(request.data);
        const context = await extractor.enrichPaper();
        console.log("Enriching paper:", context);
        sendResponse({ data: context }); // Send the enriched paper back as a response
        return true; // Required for async sendResponse
      case "processTemplate":
        // Handle processTemplate request
        console.log("Processing template with data:", request.data);
        const result = await processTemplate(request); // Relay the request to the sandbox iframe
        sendResponse(result);
        break;
      default:
        sendResponse({ data: { error: "Unknown request type", result: "" } });
    }
  },
);
