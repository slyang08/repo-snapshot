// tests/file-utils.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import { isRecentlyModified, getFileExtension } from "../src/file-utils.js";

describe("test function: isRecentlyModified", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true for a file modified within default 7 days", () => {
    vi.spyOn(fs, "statSync").mockReturnValue({ mtime: new Date() } as fs.Stats);
    expect(isRecentlyModified("file.txt")).toBe(true);
  });

  it("returns false for a file modified more than 7 days ago", () => {
    const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    vi.spyOn(fs, "statSync").mockReturnValue({ mtime: oldDate } as fs.Stats);
    expect(isRecentlyModified("file.txt")).toBe(false);
  });

  it("respects a custom number of days", () => {
    const oldDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    vi.spyOn(fs, "statSync").mockReturnValue({ mtime: oldDate } as fs.Stats);
    expect(isRecentlyModified("file.txt", 5)).toBe(true);
    expect(isRecentlyModified("file.txt", 2)).toBe(false);
  });

  it("returns false if the file does not exist", () => {
    vi.spyOn(fs, "statSync").mockImplementation(() => { throw new Error("Not found"); });
    expect(isRecentlyModified("nonexistent.txt")).toBe(false);
  });

  it("handles zero days correctly", () => {
    const today = new Date();
    vi.spyOn(fs, "statSync").mockReturnValue({ mtime: today } as fs.Stats);
    expect(isRecentlyModified("file.txt", 0)).toBe(true);
  });

  it("handles negative days gracefully", () => {
    const today = new Date();
    vi.spyOn(fs, "statSync").mockReturnValue({ mtime: today } as fs.Stats);
    expect(isRecentlyModified("file.txt", -1)).toBe(false);
  });
});

describe("test function: getFileExtension", () => {
  it("returns correct type for .ts file", () => {
    expect(getFileExtension("index.ts")).toBe("TypeScript");
  });

  it("returns correct type for .cpp file", () => {
    expect(getFileExtension("main.cpp")).toBe("Cpp");
  });

  it("returns empty string for unknown extension", () => {
    expect(getFileExtension("notes.txt")).toBe("");
  });

  it("handles uppercase extensions", () => {
    expect(getFileExtension("script.JS")).toBe("JavaScript");
  });

  it("handles files with no extension", () => {
    expect(getFileExtension("README.md")).toBe("Markdown");
  });

  it("handles complex filenames", () => {
    expect(getFileExtension("foo.test.ts")).toBe("TypeScript");
  });
});
