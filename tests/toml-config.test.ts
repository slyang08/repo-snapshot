import fs from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { parseTomlConfig } from "../src/toml-config.js";

describe("test function: parseTomlConfig", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty object when config file does not exist", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    const result = parseTomlConfig();
    expect(result).toEqual({});
  });

  it("parses valid TOML config file successfully", () => {
    const mockTomlContent = `
[options]
include = "*.ts,*.js"
exclude = "node_modules/**"
`;
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue(mockTomlContent);
    vi.spyOn(console, "info").mockImplementation(() => {});

    const result = parseTomlConfig<{
      options: { include: string; exclude: string };
    }>();

    expect(result).toHaveProperty("options");
    expect(result.options.include).toBe("*.ts,*.js");
    expect(result.options.exclude).toBe("node_modules/**");
  });

  it("throws error when TOML content is invalid", () => {
    const invalidToml = "this is not valid [ toml";
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue(invalidToml);
    vi.spyOn(console, "info").mockImplementation(() => {});

    expect(() => parseTomlConfig()).toThrow("Failed to parse config file");
  });

  it("uses custom config file path", () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    const result = parseTomlConfig("custom-config.toml");
    expect(result).toEqual({});
  });
});
