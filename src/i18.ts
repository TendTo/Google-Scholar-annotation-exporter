import type messages from "../_locales/en/messages.json";

type MessageKey = keyof typeof messages;

export function i18n(key: MessageKey, substitutions?: string | string[]): string {
  return chrome.i18n.getMessage(key, substitutions);
}
