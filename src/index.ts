#!/usr/bin/env node
import { Command } from "commander";
import { glob } from "glob";

import fs from "fs";
import path from "path";

import { buildTree } from "./utils/treeStructure.js";
import { getFileExtension, isRecentlyModified } from "./utils/fileUtils.js";
import { getGitInfo } from "./utils/gitInfo.js";

const program = new Command();

program
  .name("repo-snapshot")
  .description("Package repository context into a single text file")
  .version("0.1.0")
  .argument("[paths...]", "Files or directories to analyze")
  .option("-o, --output <file>", "Output file")
  .option(
    "--include <patterns>",
    'Comma-separated glob patterns, e.g. "*.js,*.ts"'
  )
  .option(
    "--exclude <patterns>",
    'Comma-separated glob patterns, e.g. "node_modules/**,*.log"'
  )
  .option("-r, --recent [days]", "Only include files modified within the last N days")
  .option("--grep <keyword>", "Only include files that contain the keyword")
  .option("--preview <lines>", "Only show the first N lines of each file")
  .parse(process.argv);

const options = program.opts();
const paths = program.args.length > 0 ? program.args : ["."];

function parsePatterns(patterns?: string): string[] {
  if (!patterns) return [];
  return patterns.split(",").map((p) => p.trim()).filter(Boolean);
}

const includePatterns = parsePatterns(options.include);
const excludePatterns = parsePatterns(options.exclude);

async function main() {
  const absPaths = paths.map((p) => path.resolve(p));
  console.error("Analyzing paths:", absPaths);

  if (!absPaths[0]) {
    console.error("No valid path provided");
    process.exit(1);
  }

  // Collect files with glob
  let fileList: string[] = [];
  for (const p of absPaths) {
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      const patterns = includePatterns.length > 0 ? includePatterns : ["*", "**/*"];
      for (const pattern of patterns) {
        const matches = await glob(pattern, {
          cwd: p,
          absolute: true,
          nodir: true,
          ignore: excludePatterns,
        });
        fileList.push(...matches);
      }
    } else {
      fileList.push(p);
    }
  }

  // Deduping + Sorting
  fileList = [...new Set(fileList)];
  fileList.sort();

  // Output file contents
  let totalLines = 0;
  const skippedFiles: string[] = [];
  let matchedFiles: string[] = [];

  // If --grep is specified, first filter out files matching the content.
  if (options.grep) {
    for (const file of fileList) {
      try {
        const content = fs.readFileSync(file, "utf-8");
        const regex = new RegExp(options.grep, "i");
        if (regex.test(content)) {
          matchedFiles.push(file);
        }
      } catch (error) {
        skippedFiles.push(file);
      }
    }
    fileList = matchedFiles;
  }

  // Filter for recent files if --recent flag is set
  let recentFileCount = 0;
  if (options.recent) {
    const recentDays = isNaN(options.recent) ? 7 : parseInt(options.recent, 10) || 7; // Parse the days parameter, default to 7
    fileList = fileList.filter(file => {
      const isRecent = isRecentlyModified(file, recentDays);
      if (isRecent) recentFileCount++;
      return isRecent;
    });
  }
  
  // Output information
  const rootPath = fs.statSync(absPaths[0]).isDirectory()
  ? absPaths[0]
  : path.dirname(absPaths[0]);

  let output = "# Repository Context\n\n";
  // File system path
  output += "## File System Location\n\n";
  output += absPaths.join("\n") + "\n\n";

  // Git Info
  output += await getGitInfo(absPaths[0]);

  // Build tree structure
  output += "## Structure\n\n";
  output += path.basename(rootPath) + "/\n";
  output += buildTree(fileList, rootPath);
  output += "\n\n";

  // File Contents
  if (fileList.length > 0) {
    output += "## File Contents\n\n";
    for (const file of fileList) {
      const relPath = path.relative(absPaths[0], file);
      try {
        const content = fs.readFileSync(file, "utf-8");
        const lines = content.split("\n");
        let displayedLines = lines;

        if (options.preview) {
          const previewCount = parseInt(options.preview, 10);
          if (!isNaN(previewCount) && previewCount > 0 && lines.length > previewCount) {
            displayedLines = lines.slice(0, previewCount);
            displayedLines.push("...(truncated)");
          }
        }
        output += `### File: ${relPath}\n`;
        // Simply select language based on file extension highlight
        output += "```" + getFileExtension(file) + "\n";
        output += displayedLines.join("\n") + "\n```\n\n";
        totalLines += displayedLines.length;
      } catch {
        // If no grep, shows error messages
        if (!options.grep) {
          output += `### File: ${relPath}\n[Could not read file]\n\n`;
          output += "```\n\n";
          skippedFiles.push(file);
        }
      }
    }
  }

  // Summary
  output += "## Summary\n";
  if (options.grep) {
    output += `- Files matched: ${matchedFiles.length}\n`;
  } else {
    output += `- Total files: ${fileList.length}\n`;
  }
  output += `- Total lines: ${totalLines}\n`;
  if (options.recent) {
    const recentDays = isNaN(options.recent) ? 7 : parseInt(options.recent, 10) || 7;
    output += `- Recent files (last ${recentDays} days): ${recentFileCount}\n`;
  }

  // Report skipped files to stderr
  if (skippedFiles.length > 0) {
    console.error("Skipped files (could not read):");
    skippedFiles.forEach((f) => console.error(" - " + f));
  }

  // Output to file or stdout
  if (options.output) {
    fs.writeFileSync(options.output, output, "utf-8");
    console.error(`Output written to ${options.output}`);
  } else {
    process.stdout.write(output);
  }
}

main();