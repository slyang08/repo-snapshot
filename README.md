# repo-snapshot

A Command-line interface (CLI) tool to package and summarize repository structure, Git information, and file contents in a concise, readable format.

## Features

- Outputs absolute file system paths for analyzed files and directories.
- Detects Git repository status, branch, and latest commit details.
- Displays a visual project tree structure.
- Shows contents of all relevant files with clear section delimiters and syntax highlighting.
- Filter recent files: Only include files modified within the last 7 days using the `--recent` flag.
- Provides basic statistics: total number of files, total lines, and recent files count.
- Handles standard output and error output for clear separation of results and errors.
- Skips files or directories that cannot be accessed, displaying error messages to stderr.

## Installation

To install as a global command line tool via two ways with `npm` or `pnpm`:

```
git clone https://github.com/slyang08/repo-snapshot.git
cd repo-snapshot
```

1. With `npm`:
```
npm install         # Install all dependencies
npm run build       # Compile TypeScript to dist/
npm link --global   # Install global CLI
```

2. With `pnpm`:
```
- If you have not installed pnpm, install it via:
  - macOS: brew install pnpm
  - Windows: winget install -e --id pnpm.pnpm or npm install -g pnpm
  - Linux: npm install -g pnpm

1. pnpm install         # Install all dependencies
2. pnpm build           # Compile TypeScript to dist/
3. pnpm link --global   # Install global CLI
```

> **Note:** For best consistency and to avoid dependency conflicts, use the same package manager (`npm` or `pnpm`) throughout your workflow.  
> Also ensure you have Node.js version 18 or newer installed.

## Usage

```
repo-snapshot [paths...] [options]
```

- `paths...`: Files or directories to analyze (default: current directory).
- `-o, --output <file>`: Write output to the specified file.
- `--include <patterns>`: Comma-separated glob patterns to include (e.g.: `*.js,*.ts`).
- `--exclude <patterns>`: Comma-separated glob patterns to exclude (e.g.: `node_modules/**,*.log`).
- `-r, --recent`: Only include files modified within the last 7 days (based on file system modification time).
- `-v, --version`: Print version and tool name.
- `-h, --help`: Show usage help.

## Example

```
# Package the current directory
repo-snapshot .

# Package a specific repo directory
repo-snapshot /the/path/of/major-project/you/cloned

# Package specific files
repo-snapshot src/index.ts src/utils/fileUtils.ts

# Package with output file
repo-snapshot . -o my-project-context.txt

# Package only TypeScript files
repo-snapshot . --include "**/*.ts"

# Package TypeScript files, Markdown files, and without node_modules and dist
repo-snapshot . --include "**/*.ts,*.md" --exclude "dist/**"

# Package only files modified in the last 7 days
repo-snapshot . --recent

# Package only files modified (within last N days)
repomaster . -r 2

# Package recent files with output to file
repo-snapshot . --recent --output recent-changes.txt

# Combine recent filter with other options
repo-snapshot . --recent --include "**/*.ts" --exclude "node_modules/**"
```

## Output

The tool prints repository information, including:

- **File System Location**: Absolute paths of analyzed targets.
- **Git Info**: Latest commit hash, branch, author, and date if inside a git repository.
- **Structure**: Tree visualization of files and directories, with directories ending in `/`.
- **File Contents**: Contents of files within code blocks with language syntax highlighting.
- **Summary**: Counts of total files and lines processed. When using `--recent`, also shows the count of recently modified files.
- **Warnings**: A list of files that could not be read printed to stderr during execution.

## License

This project is licensed under the Apache License 2.0.  
See the [LICENSE](LICENSE) file for details.
