export function cleanText(str: string | null | undefined) {
  return str ? str.replace(/\n+/g, " ").replace(/\s+/g, " ").trim() : "";
}

export function cleanInnerText(element: HTMLElement | string, root: Element | Document = document) {
  if (typeof element === "string")
    return cleanText(root.querySelector<HTMLElement>(element)?.innerText);
  return cleanText(element.innerText);
}

export function shortenText(str: string, maxLength: number) {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...";
}

export function failedGSFetchText(text: string | null | undefined) {
  return text && (text.includes("gs_captcha") || text.includes("www.google.com/sorry"));
}
