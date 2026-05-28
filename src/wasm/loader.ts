import type { MoldRenderer, RenderResult } from "./bridge";
import { mockRenderRaw } from "./bridge";

interface MoldWasmInstance {
  exports: {
    _start: () => void;
    mold_render: (template: string, dataJson: string) => string;
    memory?: WebAssembly.Memory;
  };
}

function parseWasmResult(raw: string): RenderResult {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.output === "string") {
      return { ok: true, output: parsed.output, durationMs: 0 };
    }
    if (parsed.error && typeof parsed.error === "object") {
      const err = parsed.error as Record<string, unknown>;
      return {
        ok: false,
        durationMs: 0,
        error: {
          kind: String(err.kind ?? "render"),
          message: String(err.message ?? "render failed"),
          line: typeof err.line === "number" ? err.line : undefined,
          column: typeof err.column === "number" ? err.column : undefined,
        },
      };
    }
  } catch {
    // not JSON — treat as raw output (should not happen with new WASM)
  }
  return { ok: true, output: raw, durationMs: 0 };
}

async function createWasmRenderer(): Promise<MoldRenderer | null> {
  try {
    const response = await fetch("/mold.wasm");
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { instance } = (await WebAssembly.instantiate(
      buffer,
      {},
      {
        builtins: ["js-string"],
        importedStringConstants: "_",
      },
    )) as unknown as { instance: MoldWasmInstance };

    instance.exports._start();

    return {
      render(template: string, dataJson: string): RenderResult {
        const start = performance.now();
        try {
          const result = instance.exports.mold_render(
            template,
            dataJson,
          );
          const durationMs = performance.now() - start;
          const parsed = parseWasmResult(result);
          return { ...parsed, durationMs };
        } catch (e) {
          const durationMs = performance.now() - start;
          const message = e instanceof Error ? e.message : String(e);
          return {
            ok: false,
            durationMs,
            error: { kind: "render", message },
          };
        }
      },
    };
  } catch (e) {
    console.warn("WASM load failed, falling back to mock:", e);
    return null;
  }
}

function createMockRenderer(): MoldRenderer {
  return {
    render(template: string, dataJson: string): RenderResult {
      return mockRenderRaw(template, dataJson);
    },
  };
}

export async function loadMold(): Promise<{
  renderer: MoldRenderer;
  wasmSizeKb: number;
}> {
  const useWasm = import.meta.env.VITE_USE_WASM !== "false";

  if (useWasm) {
    const wasmRenderer = await createWasmRenderer();
    if (wasmRenderer) {
      const resp = await fetch("/mold.wasm");
      const buf = await resp.arrayBuffer();
      const sizeKb = Math.round(buf.byteLength / 1024);
      return { renderer: wasmRenderer, wasmSizeKb: sizeKb };
    }
  }

  console.warn("Using mock renderer. Set VITE_USE_WASM=true when mold.wasm is ready.");
  return { renderer: createMockRenderer(), wasmSizeKb: 0 };
}
