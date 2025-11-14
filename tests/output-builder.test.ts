import * as path from "path";
import { beforeEach, describe, expect, it, MockedFunction, vi } from "vitest";

import { getPreviewLines } from "../src/output-builder.js";

// 🧩 Global Mock fs (must be placed at the very top)
vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  return {
    ...actual,
    readFileSync: vi.fn(() => "dummy content"),
    statSync: vi.fn(() => ({ isDirectory: () => true })),
    writeFileSync: vi.fn(),
  };
});

describe("test function: buildOutput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate output with all sections", async () => {
    const { buildOutput } = await import("../src/output-builder.js");

    const root = path.resolve(__dirname, "../src");
    const files = [path.join(root, "file-utils.ts")];

    const result = await buildOutput({
      absolutePaths: [root],
      collectedFiles: files,
      options: {},
      rootPath: root,
      recentFilesCount: 1,
      grepMatchedFiles: [],
    });

    expect(result).toContain("# Repository Context");
    expect(result).toContain("## Structure");
    expect(result).toContain("## File Contents");
    expect(result).toContain("## Summary");
  });

  it("should truncate preview lines", async () => {
    const fs = await import("fs");
    const mockReadFileSync = fs.readFileSync as MockedFunction<
      typeof fs.readFileSync
    >;
    mockReadFileSync.mockReturnValue("a\nb\nc\nd\n");

    const { buildOutput } = await import("../src/output-builder.js");

    const root = ".";
    const file = "LICENSE";

    const result = await buildOutput({
      absolutePaths: [root],
      collectedFiles: [file],
      options: { preview: "2" },
      rootPath: root,
      recentFilesCount: 0,
      grepMatchedFiles: [],
    });

    expect(result).toContain("...(truncated)");
  });

  it("should print unreadable files as [Could not read file]", async () => {
    const fs = await import("fs");
    const mockReadFileSync = fs.readFileSync as MockedFunction<
      typeof fs.readFileSync
    >;
    mockReadFileSync.mockImplementation(() => {
      throw new Error("fail");
    });

    const { buildOutput } = await import("../src/output-builder.js");

    const root = ".";
    const result = await buildOutput({
      absolutePaths: [root],
      collectedFiles: ["unreadable.txt"],
      options: {},
      rootPath: root,
      recentFilesCount: 0,
      grepMatchedFiles: [],
    });

    expect(result).toContain("[Could not read file]");
  });

  it("should include grep and recent summary fields", async () => {
    const fs = await import("fs");
    const mockReadFileSync = fs.readFileSync as MockedFunction<
      typeof fs.readFileSync
    >;
    mockReadFileSync.mockReturnValue("hello world");

    const { buildOutput } = await import("../src/output-builder.js");

    const root = ".";
    const result = await buildOutput({
      absolutePaths: [root],
      collectedFiles: ["a.txt"],
      options: { grep: "hello", recent: "5" },
      rootPath: root,
      recentFilesCount: 2,
      grepMatchedFiles: ["a.txt"],
    });

    expect(result).toContain("Files matched");
    expect(result).toContain("Total lines");
  });

  it("should handle empty collectedFiles gracefully", async () => {
    const { buildOutput } = await import("../src/output-builder.js");

    const root = ".";
    const result = await buildOutput({
      absolutePaths: [root],
      collectedFiles: [],
      options: {},
      rootPath: root,
      recentFilesCount: 0,
      grepMatchedFiles: [],
    });

    expect(result).toContain("## Summary");
    expect(result).toMatch(/Total files:\s*0/);
    expect(result).toMatch(/Total lines:\s*0/);
  });
});

describe("getPreviewLines", () => {
  const sampleContent = "line1\nline2\nline3\nline4\nline5";

  it("returns all lines if no previewOption", () => {
    expect(getPreviewLines(sampleContent, undefined)).toEqual([
      "line1",
      "line2",
      "line3",
      "line4",
      "line5",
    ]);
  });

  it("returns all lines if previewOption is invalid", () => {
    expect(getPreviewLines(sampleContent, "abc")).toEqual([
      "line1",
      "line2",
      "line3",
      "line4",
      "line5",
    ]);
  });

  it("returns truncated lines if previewOption less than total lines", () => {
    expect(getPreviewLines(sampleContent, "3")).toEqual([
      "line1",
      "line2",
      "line3",
      "...(truncated)",
    ]);
  });

  it("returns full content if previewOption >= total lines", () => {
    expect(getPreviewLines(sampleContent, "10")).toEqual([
      "line1",
      "line2",
      "line3",
      "line4",
      "line5",
    ]);
  });

  it("returns full content if previewOption is zero", () => {
    expect(getPreviewLines(sampleContent, "0")).toEqual([
      "line1",
      "line2",
      "line3",
      "line4",
      "line5",
    ]);
  });
});
