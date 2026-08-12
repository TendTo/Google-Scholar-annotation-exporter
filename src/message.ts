import type { Paper } from "./data";

type RequestType<T extends string, U> = {
  type: T;
  data: U;
};
type ResponseType<T> = { data: T };
export type EnrichPaperRequest = RequestType<"enrichPaper", Paper>;
export type EnrichPaperResponse = ResponseType<Paper>;
export type ProcessTemplateRequest = RequestType<
  "processTemplate",
  { template: string; context: any }
>;
export type ProcessTemplateResponse = ResponseType<{ result: string; error: string }>;

export type Request = EnrichPaperRequest | ProcessTemplateRequest;
export type Response<T> = T extends EnrichPaperRequest
  ? EnrichPaperResponse
  : T extends ProcessTemplateRequest
    ? ProcessTemplateResponse
    : never;
export type ResponseCb<T> = (response: Response<T>) => void;
export type RequestProcessor<T extends Request> = (request: T) => Promise<Response<T>> | Response<T>;

export function sendMessage<T>(request: T): Promise<Response<T>>;
export function sendMessage<T>(
  request: T,
  responseCallback?: ResponseCb<T>,
): void | Promise<Response<T>> {
  if (responseCallback) {
    chrome.runtime.sendMessage(request, {}, responseCallback);
    return;
  }
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(request, {}, (response: Response<T>) => {
      resolve(response);
    });
  });
}
