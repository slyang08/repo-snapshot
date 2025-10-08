import fs from "fs";
import { glob } from "glob";

// Collect files with glob
export async function collectFiles(paths: string[], include: string[], exclude: string[]): Promise<string[]> {
  let files: string[] = [];

  for (const p of paths) {
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      const patterns = include.length > 0 ? include : ["*", "**/*"];
      for (const pattern of patterns) {
        const matches = await glob(pattern, {
          cwd: p,
          absolute: true,
          nodir: true,
          ignore: exclude,
        });
        files.push(...matches);
      }
    } else {
      files.push(p);
    }
  }

  return [...new Set(files)].sort();
}
