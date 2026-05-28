import type { Store } from "./store";
import { EXAMPLES, DEFAULT_EXAMPLE_ID } from "../examples";
import { encodeBase64url, decodeBase64url } from "../utils/encode";
import { debounce } from "../utils/debounce";

function parseHash(): { exampleId?: string; t?: string; d?: string } {
  const raw = window.location.hash.slice(1);
  if (!raw) return {};

  const params = new URLSearchParams(raw);

  if (params.has("t") || params.has("d")) {
    return {
      t: params.get("t") ?? undefined,
      d: params.get("d") ?? undefined,
    };
  }

  if (params.has("example")) {
    return { exampleId: params.get("example") ?? undefined };
  }

  return {};
}

function writeExampleHash(id: string): void {
  const url = new URL(window.location.href);
  url.hash = `example=${id}`;
  window.history.replaceState(null, "", url.toString());
}

function writeContentHash(template: string, dataJson: string): void {
  const url = new URL(window.location.href);
  const t = encodeBase64url(template);
  const d = encodeBase64url(dataJson);
  url.hash = `t=${t}&d=${d}`;
  window.history.replaceState(null, "", url.toString());
}

function contentMatchesExample(template: string, dataJson: string): string | null {
  for (const ex of EXAMPLES) {
    if (ex.template === template && ex.dataJson === dataJson) {
      return ex.id;
    }
  }
  return null;
}

export function initUrlSync(store: Store): void {
  const parsed = parseHash();

  if (parsed.t && parsed.d) {
    try {
      const template = decodeBase64url(parsed.t);
      const dataJson = decodeBase64url(parsed.d);
      store.set({ template, dataJson });
      return;
    } catch {
      // fall through to default
    }
  }

  if (parsed.exampleId) {
    const ex = EXAMPLES.find((e) => e.id === parsed.exampleId);
    if (ex) {
      store.set({
        template: ex.template,
        dataJson: ex.dataJson,
        outputMode: ex.outputMode,
        activeExample: ex.id,
      });
      return;
    }
  }

  const def = EXAMPLES.find((e) => e.id === DEFAULT_EXAMPLE_ID);
  if (def) {
    store.set({
      template: def.template,
      dataJson: def.dataJson,
      outputMode: def.outputMode,
      activeExample: def.id,
    });
  }
}

export function initUrlWriter(store: Store): void {
  const write = debounce(() => {
    const s = store.get();
    const matchId = contentMatchesExample(s.template, s.dataJson);
    if (matchId) {
      writeExampleHash(matchId);
    } else {
      writeContentHash(s.template, s.dataJson);
    }
  }, 500);

  store.subscribe(write);
}
