// src/utils/outputBuilder.ts
import fs from "fs";
import path from "path";
import { buildTree, TokenCountOptions } from "./tree-structure.js";
import { getFileExtension } from "./file-utils.js";
import { getGitInfo } from "./git-info.js";

interface OutputOptions {
  absolutePaths: string[];
  collectedFiles: string[];
  options: any;
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
  const totalLines = await addFileContents(lines, collectedFiles, absolutePaths[0], options);

  addSummary(lines, collectedFiles, grepMatchedFiles, options, recentFilesCount, totalLines);

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

function addTreeStructure(lines: string[], files: string[], root: string, options: any) {
  lines.push("## Structure", "");
  lines.push(path.basename(root) + "/");

  const tokenOptions: TokenCountOptions = options.tokenCountTree
    ? { enabled: true, threshold: options.tokenCountTree }
    : { enabled: false };

  lines.push(buildTree(files, root, tokenOptions), "");
}

async function addFileContents(
  lines: string[],
  files: string[],
  basePath: string,
  options: any
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
        lines.push(`### File: ${relPath}`, "[Could not read file]", "```", "```", "");
      }
    }
  }

  return totalLines;
}

function getPreviewLines(content: string, previewOption: string | undefined): string[] {
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
  options: any,
  recentFilesCount: number,
  totalLines: number
) {
  lines.push("## Summary");

  if (options.grep) {
    lines.push(`- Files matched: ${grepMatchedFiles.length}`);
  } else {
    lines.push(`- Total files: ${files.length}`);
  }

  lines.push(`- Total lines: ${totalLines}`);

  if (options.recent && !options.grep) {
    const recentDays = isNaN(options.recent) ? 7 : parseInt(options.recent, 10) || 7;
    lines.push(`- Recent files (last ${recentDays} days): ${recentFilesCount}`);
  }
}
