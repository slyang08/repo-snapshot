import fs from "fs";
import path from "path";

export interface TokenCountOptions {
  enabled?: boolean;
  threshold?: number;
}

/**
 * Build a directory tree string, with the option to add token numbers next to files.
 */
export function buildTree(
  files: string[],
  root: string,
  tokenCountOptions?: TokenCountOptions
): string {
  if (!exists(root)) return "";
  if (isFile(root)) return path.basename(root);

  const treeLines: string[] = [];
  walkDirectory(root, "", files, treeLines, tokenCountOptions);
  return treeLines.join("\n");
}

// ================== Helper Functions ==================

function exists(p: string): boolean {
  try {
    fs.statSync(p);
    return true;
  } catch {
    return false;
  }
}

function isFile(p: string): boolean {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

/**
 * Read file token count
 */
function getTokenCount(filePath: string, options?: TokenCountOptions): number {
  if (!options?.enabled) return 0;
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return content.split(/\s+/).filter(Boolean).length;
  } catch {
    return 0;
  }
}

/**
 * Recursive Directory Traversal
 */
function walkDirectory(
  dir: string,
  prefix: string,
  files: string[],
  treeLines: string[],
  tokenCountOptions?: TokenCountOptions
) {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  const visibleEntries = entries.filter((entry) => isVisibleEntry(entry, dir, files));

  visibleEntries.forEach((entry, index) => {
    const isLast = index === visibleEntries.length - 1;
    const pointer = isLast ? "└── " : "├── ";
    const childPrefix = prefix + (isLast ? "    " : "│   ");
    const fullPath = path.join(dir, entry.name);

    let name = entry.isDirectory() ? entry.name + "/" : entry.name;

    if (entry.isFile() && tokenCountOptions?.enabled) {
      const count = getTokenCount(fullPath, tokenCountOptions);
      if (!tokenCountOptions.threshold || count >= tokenCountOptions.threshold) {
        name += ` (${count} tokens)`;
      }
    }

    treeLines.push(prefix + pointer + name);

    if (entry.isDirectory()) {
      walkDirectory(fullPath, childPrefix, files, treeLines, tokenCountOptions);
    }
  });
}

/**
 * Check whether the entry should be displayed in the tree
 */
function isVisibleEntry(entry: fs.Dirent, dir: string, files: string[]): boolean {
  const fullPath = path.join(dir, entry.name);
  if (entry.isFile()) return files.includes(path.resolve(fullPath));
  if (entry.isDirectory()) return files.some(f => f.startsWith(path.resolve(fullPath)));
  return false;
}
