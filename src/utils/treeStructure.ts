import fs from "fs";
import path from "path";

export function buildTree(files: string[], root: string): string {
  const tree: string[] = [];

  function walk(dir: string, prefix: string) {
    let entries: fs.Dirent[];

    entries = fs.readdirSync(dir, { withFileTypes: true });

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

      tree.push(prefix + pointer + entry.name);

      if (entry.isDirectory()) {
        walk(fullPath, childPrefix);
      }
    });
  }

  walk(root, "");
  return tree.join("\n");
}
