export interface RenderError {
  kind: "template" | "json";
  message: string;
  line?: number;
  column?: number;
}

export interface AppState {
  template: string;
  dataJson: string;
  output: string;
  outputMode: "text" | "svg";
  renderMs: number;
  error: RenderError | null;
  activeExample: string;
  wasmReady: boolean;
  wasmSizeKb: number;
}

export type StoreListener = (state: AppState) => void;

export function createDefaultState(): AppState {
  return {
    template: "",
    dataJson: "",
    output: "",
    outputMode: "text",
    renderMs: 0,
    error: null,
    activeExample: "",
    wasmReady: false,
    wasmSizeKb: 0,
  };
}

export class Store {
  private state: AppState;
  private listeners: Set<StoreListener>;

  constructor(initial?: Partial<AppState>) {
    this.state = { ...createDefaultState(), ...initial };
    this.listeners = new Set();
  }

  get(): AppState {
    return this.state;
  }

  set(patch: Partial<AppState>): void {
    this.state = { ...this.state, ...patch };
    for (const fn of this.listeners) {
      fn(this.state);
    }
  }

  subscribe(fn: StoreListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
}
