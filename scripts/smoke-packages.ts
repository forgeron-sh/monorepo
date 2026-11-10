// Installs the published packages as npm would, from their archives, in an empty folder, and uses
// them as a developer would (D-122): `forgeron --version`, `forgeron init`, then the new tool's build,
// tests and bundle with the SDK from its archive. What passes here is what `npm publish` would ship.
// Run `bun run packages:build` first.
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PUBLISHED } from "./packages";

const root = new URL("..", import.meta.url).pathname;

function run(cmd: string, args: string[], cwd: string): string {
  const done = spawnSync(cmd, args, { cwd, encoding: "utf8", env: { ...process.env, CI: "1" } });
  if (done.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} (in ${cwd}) failed:\n${done.stdout}\n${done.stderr}`);
  }
  return done.stdout;
}

const work = await mkdtemp(join(tmpdir(), "forgeron-smoke-"));
try {
  const tarballs = join(work, "tarballs");
  await mkdir(tarballs);
  const files = new Map<string, string>();
  for (const p of PUBLISHED) {
    const dist = join(root, p.dir, "dist");
    const { name, version } = JSON.parse(await readFile(join(dist, "package.json"), "utf8")) as {
      name: string;
      version: string;
    };
    const file = run(
      "npm",
      ["pack", dist, "--pack-destination", tarballs, "--silent"],
      root,
    ).trim();
    files.set(name, `file:${join(tarballs, file)}`);
    console.log(`packed ${name}@${version}`);
  }
  // Every Forgeron package resolves to its archive, wherever it is asked for.
  const overrides = Object.fromEntries([...files].filter(([n]) => n !== "forgeron"));

  const app = join(work, "app");
  await mkdir(app);
  await writeFile(
    join(app, "package.json"),
    JSON.stringify({ private: true, dependencies: { forgeron: files.get("forgeron") }, overrides }),
  );
  run("npm", ["install", "--no-audit", "--no-fund"], app);
  const forgeron = join(app, "node_modules", ".bin", "forgeron");
  console.log(run(forgeron, ["--version"], app).trim());

  run(forgeron, ["init", "demo"], app);
  const demo = join(app, "demo");
  const pkg = JSON.parse(await readFile(join(demo, "package.json"), "utf8")) as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  // The tool `forgeron init` wrote depends on the SDK and the CLI: both from their archives.
  if (!pkg.dependencies["@forgeron/sdk"] || !pkg.devDependencies.forgeron) {
    throw new Error("forgeron init did not write @forgeron/sdk and forgeron as dependencies.");
  }
  pkg.dependencies["@forgeron/sdk"] = files.get("@forgeron/sdk")!;
  pkg.devDependencies.forgeron = files.get("forgeron")!;
  await writeFile(join(demo, "package.json"), JSON.stringify({ ...pkg, overrides }, null, 2));
  run("npm", ["install", "--no-audit", "--no-fund"], demo);
  // The tool's own scripts, as its developer runs them.
  run("npm", ["run", "build"], demo);
  const tested = run("npm", ["test"], demo);
  console.log(
    tested
      .split("\n")
      .filter((l) => /Tests|passed|failed/.test(l))
      .join("\n"),
  );
  const own = join(demo, "node_modules", ".bin", "forgeron");
  console.log(run(own, ["bundle", "--out", join(work, "bundle")], demo).trim());
  console.log("The packages install and work.");
} finally {
  await rm(work, { recursive: true, force: true });
}
