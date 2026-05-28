import type { Store } from "../state/store";

export function createStatusbar(store: Store): void {
  const bar = document.getElementById("statusbar");
  if (!bar) return;
  const el = bar;

  function render() {
    const s = store.get();

    if (!s.wasmReady) {
      el.textContent = "\u23F3 Loading mold.wasm\u2026";
      return;
    }

    const parts: string[] = [];

    if (s.error) {
      const err = s.error;
      const loc = err.line ? ` at line ${err.line}${err.column ? `, col ${err.column}` : ""}` : "";
      parts.push(`\u26A0 ${err.kind === "json" ? "JSON error" : "Template error"}${loc}: ${err.message}`);
    } else {
      parts.push(`\u26A1 Rendered in ${s.renderMs.toFixed(1)} ms`);
    }

    if (s.wasmSizeKb > 0) {
      parts.push(`\uD83D\uDCE6 WASM ${s.wasmSizeKb} KB`);
    }

    parts.push("\u2713 Ready");

    el.textContent = parts.join("    ");
  }

  render();
  store.subscribe(render);
}
