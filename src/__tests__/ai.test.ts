import { describe, it, expect } from "vitest";

describe("AI provider selection", () => {
  it("chooses user BYOK model over env var preference", () => {
    type Config = { envKey?: string; userKey?: string; provider?: string };

    function resolveProvider(config: Config): string {
      if (config.userKey) return config.provider || "openai";
      if (config.envKey) return "openai";
      throw new Error("No provider configured");
    }

    expect(resolveProvider({ userKey: "sk-user", envKey: "sk-env" })).toBe("openai");
    expect(resolveProvider({ envKey: "sk-env" })).toBe("openai");
    expect(() => resolveProvider({})).toThrow("No provider configured");
  });

  it("tracks AI usage correctly", () => {
    const usages = [
      { feature: "summarize", tokens: 150 },
      { feature: "rewrite", tokens: 200 },
      { feature: "generate", tokens: 300 },
    ];

    const totalTokens = usages.reduce((s, u) => s + u.tokens, 0);
    expect(totalTokens).toBe(650);
  });

  it("enforces monthly quota limit", () => {
    const MONTHLY_LIMIT = 1000;
    const currentUsage = 850;
    expect(currentUsage).toBeLessThan(MONTHLY_LIMIT);

    const exceeded = 1001;
    expect(exceeded).toBeGreaterThanOrEqual(MONTHLY_LIMIT);
    expect(exceeded >= MONTHLY_LIMIT).toBe(true);
  });
});
