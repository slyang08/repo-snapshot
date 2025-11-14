// src/utils/outputBuilder.ts
import fs from "fs";
import path from "path";

import { getFileExtension } from "./file-utils.js";
import { getGitInfo } from "./git-info.js";
import { buildTree, TokenCountOptions } from "./tree-structure.js";

interface Options {
  preview?: string;
  grep?: string;
  recent?: string | number | boolean;
  tokenCountTree?: number | boolean;
  output?: string;
}

interface OutputOptions {
  absolutePaths: string[];
  collectedFiles: string[];
  options: Options;
  rootPath: string;
  recentFilesCount: number;
  grepMatchedFiles: string[];
}

export async function buildOutput({
  absolutePaths,
  collectedFiles,
  options,
  rootPath,
  recentFilesCount,
  grepMatchedFiles,
}: OutputOptions): Promise<string> {
  if (!absolutePaths[0]) {
    console.error("No valid path provided");
    process.exit(1);
  }

  const lines: string[] = [];

  addHeader(lines);
  addFileSystemLocation(lines, absolutePaths);
  await addGitInfo(lines, absolutePaths[0]);
  addTreeStructure(lines, collectedFiles, rootPath, options);

  // Obtain the valid line count returned by addFileContents
  const totalLines = await addFileContents(
    lines,
    collectedFiles,
    absolutePaths[0],
    options,
  );

  addSummary(
    lines,
    collectedFiles,
    grepMatchedFiles,
    options,
    recentFilesCount,
    totalLines,
  );

  return lines.join("\n");
}

// ========== Section Builders ==========

function addHeader(lines: string[]) {
  lines.push("# Repository Context", "");
}

function addFileSystemLocation(lines: string[], paths: string[]) {
  lines.push("## File System Location", "");
  lines.push(...paths, "");
}

async function addGitInfo(lines: string[], repoPath: string) {
  const gitInfo = await getGitInfo(repoPath);
  lines.push(gitInfo.trim(), "");
}

function addTreeStructure(
  lines: string[],
  files: string[],
  root: string,
  options: Options,
) {
  lines.push("## Structure", "");
  lines.push(path.basename(root) + "/");

  const tokenOptions: TokenCountOptions =
    options.tokenCountTree && typeof options.tokenCountTree === "number"
      ? { enabled: true, threshold: options.tokenCountTree }
      : { enabled: false };

  lines.push(buildTree(files, root, tokenOptions), "");
}

async function addFileContents(
  lines: string[],
  files: string[],
  basePath: string,
  options: Options,
): Promise<number> {
  if (files.length === 0) return 0;

  let totalLines = 0;

  lines.push("## File Contents", "");

  for (const file of files) {
    const relPath = path.relative(basePath, file);
    try {
      const content = fs.readFileSync(file, "utf-8");
      const displayed = getPreviewLines(content, options.preview);
      lines.push(`### File: ${relPath}`);
      lines.push("```" + getFileExtension(file));
      lines.push(...displayed, "```", "");

      totalLines += displayed.length;
    } catch {
      if (!options.grep) {
        lines.push(
          `### File: ${relPath}`,
          "[Could not read file]",
          "```",
          "```",
          "",
        );
      }
    }
  }

  return totalLines;
}

export function getPreviewLines(
  content: string,
  previewOption: string | undefined,
): string[] {
  const lines = content.split("\n");
  const result = [...lines];

  const previewCount = parseInt(previewOption ?? "", 10);
  if (!isNaN(previewCount) && previewCount > 0 && lines.length > previewCount) {
    return [...lines.slice(0, previewCount), "...(truncated)"];
  }

  return result;
}

function addSummary(
  lines: string[],
  files: string[],
  grepMatchedFiles: string[],
  options: Options,
  recentFilesCount: number,
  totalLines: number,
) {
  lines.push("## Summary");

  if (options.grep) {
    lines.push(`- Files matched: ${grepMatchedFiles.length}`);
  } else {
    lines.push(`- Total files: ${files.length}`);
  }

  lines.push(`- Total lines: ${totalLines}`);

  if (options.recent && !options.grep) {
    let recentDays: number;

    if (typeof options.recent === "number") {
      recentDays = options.recent;
    } else if (typeof options.recent === "string") {
      recentDays = parseInt(options.recent, 10);
      if (isNaN(recentDays)) {
        recentDays = 7;
      }
    } else if (typeof options.recent === "boolean") {
      recentDays = options.recent ? 7 : parseInt(options.recent, 10) || 7;
    } else {
      recentDays = 7;
    }
    lines.push(`- Recent files (last ${recentDays} days): ${recentFilesCount}`);
  }
}
