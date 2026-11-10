// Writes `dist/package.json` (and the README, the licence) of each published package (D-122), after
// its build. What the workspace's package.json says about sources becomes what npm needs: `exports`
// and `bin` pointing at the built files, `workspace:*` replaced by the released version, no scripts,
// no development dependencies. Fails on anything npm could not install.
import { copyFile, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PUBLISHED, REPOSITORY, type Published } from "./packages";

type Manifest = {
  name: string;
  version: string;
  license?: string;
  exports?: Record<string, string>;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, unknown>;
};

const root = new URL("..", import.meta.url).pathname;
const read = async (dir: string) =>
  JSON.parse(await readFile(join(root, dir, "package.json"), "utf8")) as Manifest;
const exists = (path: string) =>
  stat(path).then(
    () => true,
    () => false,
  );

/** `./src/db/index.ts` → the built `./db/index.js` and its types. */
function built(source: string) {
  const path = source.replace(/^\.\/src\//, "./").replace(/\.tsx?$/, "");
  return { types: `${path}.d.ts`, default: `${path}.js` };
}

async function pack(p: Published, names: Map<string, string>, version: string) {
  const own = await read(p.dir);
  if (own.version !== version) {
    throw new Error(
      `${own.name} is at ${own.version}, the others at ${version}: one version for all.`,
    );
  }
  const dist = join(root, p.dir, "dist");
  const dependencies: Record<string, string> = {};
  for (const [dep, range] of Object.entries(own.dependencies ?? {})) {
    if (!range.startsWith("workspace:")) {
      dependencies[dep] = range;
      continue;
    }
    const published = names.get(dep);
    // A workspace package the build bundled (the CLI's compiler, hosting…) is not a dependency.
    if (published) dependencies[published] = version;
    else if (!p.bin) throw new Error(`${own.name} depends on ${dep}, which is not published.`);
  }
  const exports = p.bin
    ? undefined
    : Object.fromEntries(Object.entries(own.exports ?? {}).map(([k, v]) => [k, built(v)]));
  for (const entry of Object.values(exports ?? {})) {
    for (const file of [entry.types, entry.default]) {
      if (!(await exists(join(dist, file)))) throw new Error(`${own.name}: ${file} was not built.`);
    }
  }
  for (const file of Object.values(p.bin ?? {})) {
    if (!(await exists(join(dist, file)))) throw new Error(`${own.name}: ${file} was not built.`);
  }
  const manifest = {
    name: p.name ?? own.name,
    version,
    description: p.description,
    license: own.license ?? "Apache-2.0",
    type: "module",
    repository: { type: "git", url: `git+${REPOSITORY}.git`, directory: p.dir },
    homepage: `${REPOSITORY}/tree/main/${p.dir}#readme`,
    bugs: `${REPOSITORY}/issues`,
    engines: { node: ">=24" },
    ...(p.bin ? { bin: p.bin } : { exports }),
    ...(Object.keys(dependencies).length > 0 ? { dependencies } : {}),
    ...(own.peerDependencies ? { peerDependencies: own.peerDependencies } : {}),
    ...(own.peerDependenciesMeta ? { peerDependenciesMeta: own.peerDependenciesMeta } : {}),
    publishConfig: { access: "public" },
  };
  await writeFile(join(dist, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await copyFile(join(root, "LICENSE"), join(dist, "LICENSE"));
  const readme = join(root, p.dir, "README.md");
  if (await exists(readme)) await copyFile(readme, join(dist, "README.md"));
  return manifest.name;
}

const own = await Promise.all(PUBLISHED.map((p) => read(p.dir)));
const names = new Map(PUBLISHED.map((p, i) => [own[i]!.name, p.name ?? own[i]!.name]));
const version = own[0]!.version;
for (const p of PUBLISHED) console.log(`packed ${await pack(p, names, version)}@${version}`);
