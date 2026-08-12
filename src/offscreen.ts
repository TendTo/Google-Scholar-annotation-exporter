import type {
  ProcessTemplateRequest,
  ResponseCb,
  Request,
  RequestProcessor,
} from "./message";

const processTemplate: RequestProcessor<ProcessTemplateRequest> = async (request) => {
  const iframe = document.getElementById("sandbox") as HTMLIFrameElement;
  return new Promise((resolve, reject) => {
    function handleMessage(event: MessageEvent) {
      if (event.source === iframe.contentWindow) {
        window.removeEventListener("message", handleMessage);
      }
      resolve(event.data);
    }

    window.addEventListener("message", handleMessage);
    iframe.contentWindow!.postMessage(request, "*");
  });
};

chrome.runtime.onMessage.addListener(
  async (request: Request, sender, sendResponse: ResponseCb<Request>) => {
    try {
      switch (request.type) {
        case "processTemplate":
          const result = await processTemplate(request);
          sendResponse(result);
          break;
        default:
          console.error("Unknown request type:", request);
          sendResponse({ data: { error: "Unknown request type", result: "" } });
      }
    } catch (error) {
      console.error("Error processing request:", error);
      sendResponse({ data: { error: `Error processing request: ${error}`, result: "" } });
    }
  },
);
