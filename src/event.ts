import type { Configuration, Data, State } from "./data";

export class ExportEnd extends CustomEvent<"gs-aex-export-end"> {
  static readonly eventName = "gs-aex-export-end";
  constructor() {
    super(ExportEnd.eventName);
  }
}

export class ExportStart extends CustomEvent<"gs-aex-export-start"> {
  static readonly eventName = "gs-aex-export-start";
  constructor() {
    super(ExportStart.eventName);
  }
}

export class ConfigurationChanged extends CustomEvent<Configuration> {
  static readonly eventName = "gs-aex-configuration-changed";
  constructor(configuration: Configuration) {
    super(ConfigurationChanged.eventName, { detail: configuration });
  }
}

export class StateChanged extends CustomEvent<State> {
  static readonly eventName = "gs-aex-state-changed";
  constructor(state: State) {
    super(StateChanged.eventName, { detail: state });
  }
}

export class DataChanged extends CustomEvent<Data> {
  static readonly eventName = "gs-aex-data-changed";
  constructor(data: Data) {
    super(DataChanged.eventName, { detail: data });
  }
}
