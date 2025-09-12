import path from "path";

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
