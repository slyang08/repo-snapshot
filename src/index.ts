#!/usr/bin/env node
import fs from "fs";
import path from "path";

import { buildOutput } from "./output-builder.js";
import { collectFiles } from "./file-collector.js";
import { isRecentlyModified } from "./file-utils.js";
import { parseCLI } from "./cli.js";
import { parseTomlConfig } from "./toml-config.js";

let { options, paths } = parseCLI();

if (paths.length === 0 || (paths.length === 1 && paths[0] === ".")) {
  console.info("not specified paths, using current directory.");
  // try to find toml config
  try {
    const tomlConfigOptions = parseTomlConfig();

    if (Object.keys(tomlConfigOptions).length > 0) {
      options = { ...tomlConfigOptions, ...options }; // CLI options take precedence
      console.info("Using options from config:", options);
    } else {
      console.info("No config file found, using current directory with CLI options.");
    }
  } catch (error) {
    console.error("Error parsing config file!", (error as Error).message);
    process.exit(1);
  }
}

function parsePatterns(patterns?: string): string[] {
  if (!patterns) return [];
  return patterns.split(",").map((p) => p.trim()).filter(Boolean);
}

const includePatterns = parsePatterns(options.include);
const excludePatterns = parsePatterns(options.exclude);

async function main() {
  const absolutePaths = paths.map((p) => path.resolve(p));
  console.error("Analyzing paths:", absolutePaths);

  if (!absolutePaths[0]) {
    console.error("No valid path provided");
    process.exit(1);
  }

  // Deduping + Sorting
  let collectedFiles = await collectFiles(absolutePaths, includePatterns, excludePatterns);

  // Output file contents
  const skippedFiles: string[] = [];
  let grepMatchedFiles: string[] = [];

  // If --grep is specified, first filter out files matching the content.
  if (options.grep) {
    for (const file of collectedFiles) {
      try {
        const content = fs.readFileSync(file, "utf-8");
        const regex = new RegExp(options.grep, "i");
        if (regex.test(content)) {
          grepMatchedFiles.push(file);
        }
      } catch (error) {
        skippedFiles.push(file);
      }
    }
    collectedFiles = grepMatchedFiles;
  }

  // Filter for recent files if --recent flag is set
  let recentFilesCount = 0;
  if (options.recent) {
    // Parse the days parameter, default to 7
    const recentDays = isNaN(options.recent) ? 7 : parseInt(options.recent, 10) || 7;
    collectedFiles = collectedFiles.filter(file => {
      const isRecent = isRecentlyModified(file, recentDays);
      if (isRecent) recentFilesCount++;
      return isRecent;
    });
  }

  // Output information
  const rootPath = fs.statSync(absolutePaths[0]).isDirectory()
    ? absolutePaths[0]
    : path.dirname(absolutePaths[0]);

  const output = await buildOutput({
    absolutePaths,
    collectedFiles,
    options,
    rootPath,
    recentFilesCount,
    grepMatchedFiles
  });

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
