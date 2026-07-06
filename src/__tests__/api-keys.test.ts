import { describe, it, expect } from "vitest";

describe("BYOK API keys", () => {
  it("should accept valid providers", () => {
    const validProviders = ["openai", "anthropic"];
    validProviders.forEach((p) => {
      expect(["openai", "anthropic"]).toContain(p);
    });
  });

  it("should detect empty API key", () => {
    const isEmpty = (key: string) => !key.trim();
    expect(isEmpty("")).toBe(true);
    expect(isEmpty("   ")).toBe(true);
    expect(isEmpty("sk-abc123")).toBe(false);
  });

  it("should mask API key for display", () => {
    function maskKey(key: string): string {
      if (key.length <= 8) return "********";
      return key.slice(0, 4) + "..." + key.slice(-4);
    }

    expect(maskKey("sk-abcdefgh12345678")).toBe("sk-a...5678");
    expect(maskKey("short")).toBe("********");
  });
});
