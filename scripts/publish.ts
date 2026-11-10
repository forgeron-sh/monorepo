// Publishes the packages on npm (D-122), in order, after `bun run packages:build` and the smoke test.
// A version already on npm is skipped, so a failed run can be run again. In the release workflow npm
// authenticates by trusted publishing (OIDC), and adds provenance itself when the repository is
// public; the very first publication of a package is run by hand by a maintainer (`npm login`).
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PUBLISHED } from "./packages";

const root = new URL("..", import.meta.url).pathname;

for (const p of PUBLISHED) {
  const dist = join(root, p.dir, "dist");
  const { name, version } = JSON.parse(await readFile(join(dist, "package.json"), "utf8")) as {
    name: string;
    version: string;
  };
  const seen = spawnSync("npm", ["view", `${name}@${version}`, "version"], { encoding: "utf8" });
  if (seen.status === 0 && seen.stdout.trim() === version) {
    console.log(`${name}@${version} is already on npm.`);
    continue;
  }
  const args = ["publish", dist, "--access", "public"];
  const done = spawnSync("npm", args, { stdio: "inherit" });
  if (done.status !== 0) throw new Error(`npm ${args.join(" ")} failed.`);
  console.log(`published ${name}@${version}`);
}
