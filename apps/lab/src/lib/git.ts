import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

/** The repository root: Astro runs from `apps/lab` (the code is bundled, so not `import.meta.url`). */
const ROOT = resolve(process.cwd(), "../..");

export interface Commit {
  date: string;
  /** The Conventional Commits scope, `draw` in `perf(draw): …`, if any. */
  scope?: string;
  type: string;
  subject: string;
  hash: string;
}

function git(args: string[]): string {
  try {
    return execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    // Built outside a clone (an archive): the dates are left out, nothing else changes.
    return "";
  }
}

/** Parses `type(scope): subject`; a line that is not a Conventional Commit keeps its text. */
export function parseSubject(line: string): Pick<Commit, "type" | "scope" | "subject"> {
  const m = /^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/.exec(line);
  if (!m) return { type: "", subject: line };
  return { type: m[1]!, subject: m[3]!, ...(m[2] ? { scope: m[2] } : {}) };
}

/** The date (ISO) of the last commit that touched `dir`. */
export function lastChange(dir: string): string | undefined {
  return git(["log", "-1", "--format=%cs", "--", dir]).trim() || undefined;
}

/** The last `n` commits that touched any of `dirs`, newest first. */
export function recentCommits(dirs: readonly string[], n: number): Commit[] {
  const out = git(["log", `-${n}`, "--no-merges", "--format=%cs%x09%h%x09%s", "--", ...dirs]);
  return out
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [date = "", hash = "", text = ""] = line.split("\t");
      return { date, hash, ...parseSubject(text) };
    });
}
