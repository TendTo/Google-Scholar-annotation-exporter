import type { Paper } from "./data";

type RequestType<T extends string, U> = {
  type: T;
  data: U;
};
type ResponseType<T> = { data: T };
export type EnrichPaperRequest = RequestType<"enrichPaper", Paper>;
export type EnrichPaperResponse = ResponseType<Paper>;

export type Request = EnrichPaperRequest;
export type Response<T> = T extends EnrichPaperRequest ? EnrichPaperResponse : never;
export type ResponseCb<T> = (response: Response<T>) => void;

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
