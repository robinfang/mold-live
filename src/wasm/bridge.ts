export interface RenderResult {
  ok: boolean;
  output?: string;
  durationMs: number;
  error?: { kind: string; message: string; line?: number; column?: number };
}

export interface MoldRenderer {
  render(template: string, dataJson: string): RenderResult;
}

interface ForState {
  items: unknown[];
  index: number;
}

function resolvePath(data: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = data;
  for (const seg of path) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[seg];
  }
  return current;
}

function applyFilter(
  value: unknown,
  filterName: string,
  argRaw: string,
): unknown {
  switch (filterName.trim()) {
    case "length":
      if (Array.isArray(value)) return value.length;
      if (typeof value === "string") return value.length;
      if (value === null || value === undefined) return 0;
      return 0;
    case "default":
      return value === null || value === undefined || value === ""
        ? argRaw
        : value;
    default:
      return value;
  }
}

function toString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return "";
}

function evaluateCondition(
  raw: string,
  data: Record<string, unknown>,
  forLoop: ForState | null,
): boolean {
  const expr = raw.trim();

  if (expr === "") return false;
  if (expr === "true") return true;
  if (expr === "false") return false;
  if (expr === "null") return false;

  const gtMatch = expr.match(/^(.*?)\s*>\s*(.*)$/);
  if (gtMatch) {
    const left = resolveValue(gtMatch[1].trim(), data, forLoop);
    const right = resolveValue(gtMatch[2].trim(), data, forLoop);
    return Number(left) > Number(right);
  }

  const ltMatch = expr.match(/^(.*?)\s*<\s*(.*)$/);
  if (ltMatch) {
    const left = resolveValue(ltMatch[1].trim(), data, forLoop);
    const right = resolveValue(ltMatch[2].trim(), data, forLoop);
    return Number(left) < Number(right);
  }

  const eqMatch = expr.match(/^(.*?)\s*==\s*(.*)$/);
  if (eqMatch) {
    const left = resolveValue(eqMatch[1].trim(), data, forLoop);
    const right = resolveValue(eqMatch[2].trim(), data, forLoop);
    return String(left) === String(right);
  }

  const neqMatch = expr.match(/^(.*?)\s*!=\s*(.*)$/);
  if (neqMatch) {
    const left = resolveValue(neqMatch[1].trim(), data, forLoop);
    const right = resolveValue(neqMatch[2].trim(), data, forLoop);
    return String(left) !== String(right);
  }

  const value = resolveValue(expr, data, forLoop);
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.length > 0;
  if (typeof value === "number") return value !== 0;
  return true;
}

function resolveValue(
  expr: string,
  data: Record<string, unknown>,
  forLoop: ForState | null,
): unknown {
  expr = expr.trim();

  const quotedMatch = expr.match(/^"([^"]*)"$/) || expr.match(/^'([^']*)'$/);
  if (quotedMatch) return quotedMatch[1];

  if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);

  const filterMatch = expr.match(/^(.+?)\s*\|\s*(\w+)(?:\s*\((.+?)\))?\s*$/);
  if (filterMatch) {
    const base = resolveValue(filterMatch[1].trim(), data, forLoop);
    return applyFilter(base, filterMatch[2], (filterMatch[3] ?? "").trim());
  }

  const segments = expr.split(".");
  const first = segments[0];

  if (first === "loop" && forLoop) {
    const prop = segments[1];
    const items = forLoop.items;
    const idx = forLoop.index;
    switch (prop) {
      case "index":
        return idx + 1;
      case "index0":
        return idx;
      case "first":
        return idx === 0;
      case "last":
        return idx === items.length - 1;
      case "length":
        return items.length;
      default:
        return undefined;
    }
  }

  return resolvePath(data, segments);
}

function renderTemplate(
  source: string,
  data: Record<string, unknown>,
  forLoop: ForState | null = null,
): string {
  let out = "";
  let i = 0;

  while (i < source.length) {
    const nextVar = source.indexOf("{{", i);
    const nextTag = source.indexOf("{%", i);
    const nextComment = source.indexOf("{#", i);

    let next = -1;
    let kind: "var" | "tag" | "comment" | null = null;

    const candidates: [number, "var" | "tag" | "comment"][] = [];
    if (nextVar !== -1) candidates.push([nextVar, "var"]);
    if (nextTag !== -1) candidates.push([nextTag, "tag"]);
    if (nextComment !== -1) candidates.push([nextComment, "comment"]);

    if (candidates.length === 0) {
      out += source.slice(i);
      break;
    }

    candidates.sort((a, b) => a[0] - b[0]);
    [next, kind] = candidates[0];

    out += source.slice(i, next);

    if (kind === "comment") {
      const end = source.indexOf("#}", next + 2);
      if (end === -1) {
        out += source.slice(next);
        break;
      }
      i = end + 2;
      continue;
    }

    if (kind === "var") {
      const end = source.indexOf("}}", next + 2);
      if (end === -1) {
        out += source.slice(next);
        break;
      }
      const expr = source.slice(next + 2, end).trim();
      const value = resolveValue(expr, data, forLoop);
      out += toString(value);
      i = end + 2;
      continue;
    }

    if (kind === "tag") {
      const close = source.indexOf("%}", next + 2);
      if (close === -1) {
        out += source.slice(next);
        break;
      }
      const tagContent = source.slice(next + 2, close).trim();

      if (tagContent.startsWith("for ")) {
        const forMatch = tagContent.match(
          /^for\s+(\w+)\s+in\s+(.+?)\s*$/,
        );
        if (!forMatch) {
          i = close + 2;
          continue;
        }
        const varName = forMatch[1];
        const iterExpr = forMatch[2];
        const iterable = resolveValue(iterExpr, data, forLoop);
        if (!Array.isArray(iterable)) {
          i = close + 2;
          continue;
        }

        const bodyStart = close + 2;
        const endforPos = findMatchingTag(source, bodyStart, "endfor");
        if (endforPos === -1) {
          i = close + 2;
          continue;
        }
        const body = source.slice(bodyStart, endforPos);
        const endforClose = source.indexOf("%}", endforPos) + 2;

        const items = iterable as unknown[];
        for (let idx = 0; idx < items.length; idx++) {
          const itemData = { ...data, [varName]: items[idx] };
          const subLoop: ForState = { items, index: idx };
          out += renderTemplate(body, itemData, subLoop);
        }
        i = endforClose;
        continue;
      }

      if (tagContent.startsWith("if ")) {
        const condExpr = tagContent.slice(3).trim();
        const bodyStart = close + 2;

        const elsePos = findMatchingTag(source, bodyStart, "else");
        const endifPos = findMatchingTag(source, bodyStart, "endif");
        const endifClose = source.indexOf("%}", endifPos) + 2;

        const condResult = evaluateCondition(condExpr, data, forLoop);

        if (condResult) {
          const thenEnd = elsePos !== -1 ? elsePos : endifPos;
          const thenBody = source.slice(bodyStart, thenEnd);
          out += renderTemplate(thenBody, data, forLoop);
        } else if (elsePos !== -1) {
          const elseBodyStart =
            source.indexOf("%}", elsePos) + 2;
          const elseBody = source.slice(elseBodyStart, endifPos);
          out += renderTemplate(elseBody, data, forLoop);
        }

        i = endifClose;
        continue;
      }

      if (tagContent === "else") {
        out += source.slice(next, close + 2);
        i = close + 2;
        continue;
      }

      if (tagContent === "endif" || tagContent === "endfor") {
        i = close + 2;
        continue;
      }

      i = close + 2;
      continue;
    }
  }

  return out;
}

function findMatchingTag(
  source: string,
  start: number,
  tagName: string,
): number {
  let depth = 1;
  let pos = start;
  while (pos < source.length) {
    const openIf = source.indexOf("{% if", pos);
    const openFor = source.indexOf("{% for", pos);
    const elseTag = source.indexOf("{% else", pos);
    const endifTag = source.indexOf("{% endif", pos);
    const endforTag = source.indexOf("{% endfor", pos);

    const candidates: [number, string][] = [];
    if (openIf !== -1) candidates.push([openIf, "open_if"]);
    if (openFor !== -1) candidates.push([openFor, "open_for"]);
    if (elseTag !== -1) candidates.push([elseTag, "else"]);
    if (endifTag !== -1) candidates.push([endifTag, "close_if"]);
    if (endforTag !== -1) candidates.push([endforTag, "close_for"]);

    if (candidates.length === 0) return -1;

    candidates.sort((a, b) => a[0] - b[0]);
    const [nextPos, kind] = candidates[0];

    if (kind === "open_if" || kind === "open_for") {
      depth++;
    } else if (kind === "close_if" || kind === "close_for") {
      depth--;
      if (depth === 0 && tagName === (kind === "close_if" ? "endif" : "endfor")) {
        return nextPos;
      }
    } else if (kind === "else") {
      if (depth === 1 && tagName === "else") {
        return nextPos;
      }
    }

    pos = nextPos + 1;
  }
  return -1;
}

export function mockRenderRaw(template: string, dataJson: string): RenderResult {
  const start = performance.now();
  try {
    const data = JSON.parse(dataJson) as Record<string, unknown>;
    const output = renderTemplate(template, data);
    const durationMs = performance.now() - start;
    return { ok: true, output, durationMs };
  } catch (e) {
    const durationMs = performance.now() - start;
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      durationMs,
      error: { kind: "json", message },
    };
  }
}
