import fs from "fs";
import path from "path";

export function buildTree(files: string[], root: string): string {
  const tree: string[] = [];

  try {
    const rootStat = fs.statSync(root);
    if (rootStat.isFile()) {
      // If root is a file, return the filename directly
      return path.basename(root);
    }
  } catch (error) {
    // Log error if root does not exist or stat fails
    console.error(`Error: Unable to access root path "${root}".`, error);
    return "";
  }

  function walk(dir: string, prefix: string) {
    let entries: fs.Dirent[];

    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      // Log error when directory cannot be read
      console.error(`Error: Unable to read directory "${dir}".`, error);
      return;
    }

    const visibleEntries = entries.filter((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile()) {
        return files.includes(path.resolve(fullPath));
      } else if (entry.isDirectory()) {
        return files.some((f) => f.startsWith(path.resolve(fullPath)));
      }
      return false;
    });

    visibleEntries.forEach((entry, index) => {
      const isLast = index === visibleEntries.length - 1;
      const pointer = isLast ? "└── " : "├── ";
      const childPrefix = prefix + (isLast ? "    " : "│   ");
      const fullPath = path.join(dir, entry.name);

      const name = entry.isDirectory() ? entry.name + "/" : entry.name;

      tree.push(prefix + pointer + name);

      if (entry.isDirectory()) {
        walk(fullPath, childPrefix);
      }
    });
  }

  walk(root, "");
  return tree.join("\n");
}
