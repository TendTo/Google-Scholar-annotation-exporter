import { ConfigurationChanged, DataChanged, StateChanged } from "./event";

const CONFIGURATION_KEY = "gs-aex-configuration";
const DATA_KEY = "gs-aex-data";
const STATE_KEY = "gs-aex-state";

export const CITATION_STYLES = ["MLA", "APA", "Chicago", "Harvard", "Vancouver"] as const;
export const EXPORT_FORMATS = ["CSV", "JSON", "LaTex", "Markdown", "Custom"] as const;
export const COLOR_MAP = {
  "-1": "",
  "1": "Yellow",
  "2": "Green",
  "3": "Blue",
  "4": "Pink",
  "6": "Purple",
} as const;

export type ColorIdx = keyof typeof COLOR_MAP;
export type Color = (typeof COLOR_MAP)[ColorIdx];
export type Format = (typeof EXPORT_FORMATS)[number];
export type CitationStyle = (typeof CITATION_STYLES)[number];

export type Configuration = {
  citationStyle: CitationStyle;
  exportFormat: Format;
  fetchContext: boolean;
  customExportTemplate: string;
};

export type State = {
  isMultipageExporting: boolean;
};

export type Annotation = {
  highlightText: string;
  note: string;
  highlightColor: string;
  context: string;
  page: number;
};

export type Paper = {
  error: string;
  captcha: boolean;
  title: string;
  authors: string;
  year: string;
  link: string;
  citation: string;
  metadata: string[];
  annotations: Annotation[];
  journal: string;
};

export type Data = {
  paperCount: number;
  papers: Paper[];
};

const DEFAULT_CONFIGURATION: Configuration = {
  citationStyle: "MLA",
  exportFormat: "Markdown",
  fetchContext: false,
  customExportTemplate: "",
} as const;

const DEFAULT_STATE: State = {
  isMultipageExporting: false,
} as const;

const DEFAULT_DATA: Data = {
  paperCount: 0,
  papers: [],
} as const;

const DEFAULT_PAPER: Paper = {
  error: "",
  captcha: false,
  title: "",
  authors: "",
  journal: "",
  year: "",
  link: "",
  citation: "",
  metadata: [],
  annotations: [],
} as const;

export function defaultPaper(): Paper {
  return { ...DEFAULT_PAPER };
}

function createStorageAccessors<T>(
  key: string,
  defaultValue: T,
  event: new (value: T) => CustomEvent<T>,
  storage: chrome.storage.StorageArea,
) {
  async function load(): Promise<T> {
    const raw = (await storage.get(key)) as { [key: string]: T };
    return raw[key] ?? defaultValue;
  }

  async function save(value: T): Promise<T> {
    await storage.set({ [key]: value });
    document.dispatchEvent(new event(value));
    return value;
  }

  async function update(value: Partial<T>): Promise<T> {
    return await save({ ...(await load()), ...value });
  }

  async function reset(): Promise<T> {
    return await save(defaultValue);
  }

  return { load, save, update, reset };
}

export const {
  load: loadConfiguration,
  save: saveConfiguration,
  update: updateConfiguration,
  reset: resetConfiguration,
} = createStorageAccessors<Configuration>(
  CONFIGURATION_KEY,
  DEFAULT_CONFIGURATION,
  ConfigurationChanged,
  chrome.storage.sync,
);

export const {
  load: loadState,
  save: saveState,
  update: updateState,
  reset: resetState,
} = createStorageAccessors<State>(STATE_KEY, DEFAULT_STATE, StateChanged, chrome.storage.local);

export const {
  load: loadData,
  save: saveData,
  update: updateData,
  reset: resetData,
} = createStorageAccessors<Data>(DATA_KEY, DEFAULT_DATA, DataChanged, chrome.storage.local);
