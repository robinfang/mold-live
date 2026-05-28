import { describe, it, expect } from "vitest";
import { mockRenderRaw } from "./bridge";

describe("mockRenderRaw", () => {
  it("renders simple interpolation", () => {
    const result = mockRenderRaw(
      "Hello, {{ name }}!",
      JSON.stringify({ name: "MoonBit" }),
    );
    expect(result.ok).toBe(true);
    expect(result.output).toBe("Hello, MoonBit!");
  });

  it("renders nested property access", () => {
    const result = mockRenderRaw(
      "Hi {{ user.name }}",
      JSON.stringify({ user: { name: "Alice" } }),
    );
    expect(result.ok).toBe(true);
    expect(result.output).toBe("Hi Alice");
  });

  it("renders for loop", () => {
    const result = mockRenderRaw(
      "{% for item in items %}{{ item }}\n{% endfor %}",
      JSON.stringify({ items: ["a", "b"] }),
    );
    expect(result.ok).toBe(true);
    expect(result.output).toBe("a\nb\n");
  });

  it("renders for loop with loop.index", () => {
    const result = mockRenderRaw(
      "{% for x in arr %}{{ loop.index }}:{{ x }}\n{% endfor %}",
      JSON.stringify({ arr: ["a", "b"] }),
    );
    expect(result.ok).toBe(true);
    expect(result.output).toBe("1:a\n2:b\n");
  });

  it("renders for loop with loop.first/last", () => {
    const result = mockRenderRaw(
      "{% for x in arr %}{{ x }}{% if loop.first %}-first{% endif %}{% if loop.last %}-last{% endif %}\n{% endfor %}",
      JSON.stringify({ arr: ["a", "b", "c"] }),
    );
    expect(result.ok).toBe(true);
    expect(result.output).toBe("a-first\nb\nc-last\n");
  });

  it("renders if block", () => {
    const result = mockRenderRaw(
      "{% if show %}yes{% endif %}",
      JSON.stringify({ show: true }),
    );
    expect(result.ok).toBe(true);
    expect(result.output).toBe("yes");
  });

  it("renders if/else block", () => {
    const result = mockRenderRaw(
      "{% if show %}yes{% else %}no{% endif %}",
      JSON.stringify({ show: false }),
    );
    expect(result.ok).toBe(true);
    expect(result.output).toBe("no");
  });

  it("renders if with comparison", () => {
    const result = mockRenderRaw(
      "{% if value > 0 %}positive{% endif %}",
      JSON.stringify({ value: 5 }),
    );
    expect(result.ok).toBe(true);
    expect(result.output).toBe("positive");
  });

  it("renders length filter", () => {
    const result = mockRenderRaw(
      "{{ items | length }}",
      JSON.stringify({ items: [1, 2, 3] }),
    );
    expect(result.ok).toBe(true);
    expect(result.output).toBe("3");
  });

  it("renders length filter on string", () => {
    const result = mockRenderRaw(
      "{{ text | length }}",
      JSON.stringify({ text: "hello" }),
    );
    expect(result.ok).toBe(true);
    expect(result.output).toBe("5");
  });

  it("skips comments", () => {
    const result = mockRenderRaw(
      "hello{# world #}mold",
      JSON.stringify({}),
    );
    expect(result.ok).toBe(true);
    expect(result.output).toBe("hellomold");
  });

  it("returns error for invalid JSON", () => {
    const result = mockRenderRaw("{{ x }}", "invalid");
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error!.kind).toBe("json");
  });

  it("returns empty string for missing variable", () => {
    const result = mockRenderRaw(
      "{{ missing }}",
      JSON.stringify({}),
    );
    expect(result.ok).toBe(true);
    expect(result.output).toBe("");
  });

  it("returns empty string for null value", () => {
    const result = mockRenderRaw(
      "{{ val }}",
      JSON.stringify({ val: null }),
    );
    expect(result.ok).toBe(true);
    expect(result.output).toBe("");
  });

  it("measures duration", () => {
    const result = mockRenderRaw(
      "hello",
      JSON.stringify({}),
    );
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
