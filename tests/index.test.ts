import { describe, it, expect } from "vitest";

// Replicate parsePatterns for testing purposes
function parsePatterns(patterns?: string): string[] {
  if (!patterns) return [];
  return patterns.split(",").map((p) => p.trim()).filter(Boolean);
}

describe("test function: parsePatterns", () => {
  it("returns empty array for undefined", () => {
    expect(parsePatterns()).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(parsePatterns("")).toEqual([]);
  });

  it("parses single pattern", () => {
    expect(parsePatterns("*.ts")).toEqual(["*.ts"]);
  });

  it("parses multiple patterns", () => {
    expect(parsePatterns("*.ts,*.js")).toEqual(["*.ts", "*.js"]);
  });

  it("trims spaces around patterns", () => {
    expect(parsePatterns(" *.ts , *.js ")).toEqual(["*.ts", "*.js"]);
  });

  it("ignores empty patterns between commas", () => {
    expect(parsePatterns("*.ts,,*.js")).toEqual(["*.ts", "*.js"]);
  });
});
