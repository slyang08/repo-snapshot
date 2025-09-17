import path from "path";
import fs from "fs";

const extensionMap = new Map<string, string>([
  [".ts", "TypeScript"],
  [".js", "JavaScript"],
  [".json", "json"],
  [".md", "Markdown"],
  [".py", "Python"],
  [".java", "Java"],
  [".cpp", "Cpp"],
  [".cc", "Cpp"],
  [".cxx", "Cpp"],
  [".c", "C"]
]);

export function getFileExtension(file: string): string {
  const ext = path.extname(file).toLowerCase();
  return extensionMap.get(ext) ?? "";
}

/**
 * Check if a file was modified within the specified number of days
 * @param filePath - Path to the file to check
 * @param days - Number of days to check (default: 7)
 * @returns true if the file was modified within the specified days, false otherwise
 */
export function isRecentlyModified(filePath: string, days: number = 7): boolean {
  try {
    const stats = fs.statSync(filePath);
    const lastModifiedTime = stats.mtime;
    const currentTime = new Date();
    
    // Calculate the difference in milliseconds
    const timeDifference = currentTime.getTime() - lastModifiedTime.getTime();
    
    // Convert to days
    const daysDifference = timeDifference / (1000 * 60 * 60 * 24);
    
    return daysDifference <= days;
  } catch (error) {
    // If we can't read the file stats, consider it not recently modified
    return false;
  }
}
