import type { EnrichPaperRequest, ResponseCb } from "./message";
import { PDFContextExtractor } from "./pdf";

chrome.runtime.onMessage.addListener(
  async (request: EnrichPaperRequest, sender, sendResponse: ResponseCb<EnrichPaperRequest>) => {
    if (request.type === "enrichPaper") {
      const extractor = new PDFContextExtractor(request.data);
      const context = await extractor.enrichPaper();
      console.log("Enriching paper:", context);
      sendResponse({ data: context }); // Send the enriched paper back as a response
      return true; // Required for async sendResponse
    }
  },
);
