import { simpleGit } from "simple-git";
import fs from "fs";
import path from "path";

export async function getGitInfo(repoPath: string): Promise<string> {
  try {
    const stats = fs.statSync(repoPath);
    if (!stats.isDirectory()) {
      repoPath = path.dirname(repoPath); // If the input is a file, change it to the parent directory
    }
  } catch {
    return "## Git Info\n\nNot a git repository\n\n";
  }

  const git = simpleGit(repoPath);

  try {
    const log = await git.log({ maxCount: 1 });
    const branch = await git.revparse(["--abbrev-ref", "HEAD"]);
    const commit = log.latest;

    if (commit) {
      return (
        "## Git Info\n\n" +
        `- Commit: ${commit.hash}\n` +
        `- Branch: ${branch}\n` +
        `- Author: ${commit.author_name} <${commit.author_email}>\n` +
        `- Date: ${commit.date}\n\n`
      );
    }
  } catch {
    return "## Git Info\n\nNot a git repository\n\n";
  }

  return "## Git Info\n\nNot a git repository\n\n";
}
