import type { MoldRenderer, RenderResult } from "../wasm/bridge";
import type { Store } from "./store";

export function renderTemplate(
  renderer: MoldRenderer,
  store: Store,
): void {
  const state = store.get();

  try {
    JSON.parse(state.dataJson);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    store.set({
      error: { kind: "json", message },
      renderMs: 0,
    });
    return;
  }

  const result: RenderResult = renderer.render(
    state.template,
    state.dataJson,
  );

  if (result.ok && result.output !== undefined) {
    store.set({
      output: result.output,
      error: null,
      renderMs: result.durationMs,
    });
  } else if (result.error) {
    store.set({
      error: {
        ...result.error,
        kind: result.error.kind as "template" | "json",
      },
      renderMs: result.durationMs,
    });
  }
}
