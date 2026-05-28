import { describe, it, expect } from "vitest";
import { encodeBase64url, decodeBase64url } from "./encode";

describe("encodeBase64url", () => {
  it("encodes a string", () => {
    const encoded = encodeBase64url("hello");
    expect(encoded).toBe("aGVsbG8");
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });

  it("round-trips non-ASCII text", () => {
    const original = "Hello, 世界!";
    const encoded = encodeBase64url(original);
    const decoded = decodeBase64url(encoded);
    expect(decoded).toBe(original);
  });

  it("round-trips long text with special chars", () => {
    const original = "{{ name }}\n{% for x in items %}\n  - {{ x }}\n{% endfor %}";
    const encoded = encodeBase64url(original);
    const decoded = decodeBase64url(encoded);
    expect(decoded).toBe(original);
  });

  it("decodeBase64url handles unpadded input", () => {
    const decoded = decodeBase64url("aGVsbG8");
    expect(decoded).toBe("hello");
  });
});
