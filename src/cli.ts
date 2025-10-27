import { Command } from "commander";

export function parseCLI() {
  const program = new Command();

  program
    .name("repo-snapshot")
    .description("Package repository context into a single text file")
    .version("0.1.0")
    .argument("[paths...]", "Files or directories to analyze")
    .option("-o, --output <file>", "Output file")
    .option("--include <patterns>", 'Comma-separated glob patterns, e.g. "*.js,*.ts"')
    .option("--exclude <patterns>", 'Comma-separated glob patterns, e.g. "node_modules/**,*.log"')
    .option("-r, --recent [days]", "Only include files modified within the last N days", parseInt)
    .option("--grep <keyword>", "Only include files that contain the keyword")
    .option("--preview <lines>", "Only show the first N lines of each file", parseInt)
    .option("--token-count-tree [threshold]", "Show file tree with N tokens count (≥ threshold)", parseInt)
    .parse(process.argv);

  return {
    options: program.opts(),
    paths: program.args.length > 0 ? program.args : ["."],
  };
}
