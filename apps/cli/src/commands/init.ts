import { ToolNameSchema } from "@forgeron/manifest";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { UsageError, type Io } from "../io";
import {
  MARKETPLACE_INDEX_PATH,
  marketplaceFiles,
  repositoryFiles,
  toolFiles,
} from "@forgeron/scaffold";
import { fetchTemplate, SDK_VERSION, writeTemplate } from "../template";

// `forgeron init [name] [--template crm]`: a tool of one action, with its test and its `.forgeron/`,
// alone in its repository: with its CI workflow, AGENTS.md, CLAUDE.md and docs/lifecycle.md (D-121).
// At the root of a marketplace (a `forgeron-marketplace.json` there), the tool goes in `tools/<name>/`
// and is listed in the index. `forgeron init marketplace [name]` creates a marketplace.

const USAGE = "Usage: forgeron init [name] [--template <name>] | forgeron init marketplace [name]";

async function write(dir: string, files: Record<string, string>) {
  for (const [path, content] of Object.entries(files)) {
    await mkdir(join(dir, path, ".."), { recursive: true });
    await writeFile(join(dir, path), content);
  }
}

async function emptyDir(dir: string) {
  await mkdir(dir, { recursive: true });
  if ((await readdir(dir)).length > 0) {
    throw new UsageError(`${dir} is not empty: \`forgeron init\` does not overwrite a folder.`);
  }
}

/** The index of the marketplace at `root`, or `undefined` when `root` is not a marketplace. */
async function marketplaceAt(root: string): Promise<{ tools: unknown[] } | undefined> {
  try {
    const index = JSON.parse(await readFile(join(root, MARKETPLACE_INDEX_PATH), "utf8")) as {
      tools?: unknown;
    };
    return Array.isArray(index.tools) ? (index as { tools: unknown[] }) : { ...index, tools: [] };
  } catch {
    return undefined;
  }
}

async function initMarketplace(args: string[], io: Io): Promise<number> {
  if (args.length > 1) throw new UsageError(USAGE);
  const dir = args[0] ? resolve(io.cwd, args[0]) : io.cwd;
  const parsed = ToolNameSchema.safeParse(basename(dir));
  if (!parsed.success) {
    throw new UsageError(
      `"${basename(dir)}" is not a marketplace name: use a-z, 0-9 and "-". Pass one: forgeron init marketplace my-tools`,
    );
  }
  const name = parsed.data;
  await emptyDir(dir);
  await write(dir, marketplaceFiles(name));
  io.log(`Created the marketplace ${name} in ${dir}`);
  io.log("  forgeron init <name>   add a tool, in tools/<name>/");
  return 0;
}

export async function init(args: string[], io: Io): Promise<number> {
  if (args[0] === "marketplace") return initMarketplace(args.slice(1), io);
  const { positionals, values } = parseArgs({
    args,
    allowPositionals: true,
    options: { template: { type: "string" } },
  });
  if (positionals.length > 1) throw new UsageError(USAGE);

  // At a marketplace's root, a tool goes in tools/<name>/ and joins the index.
  const marketplace = positionals[0] ? await marketplaceAt(io.cwd) : undefined;
  const dir = positionals[0]
    ? resolve(io.cwd, marketplace ? "tools" : ".", positionals[0])
    : io.cwd;
  const parsed = ToolNameSchema.safeParse(basename(dir));
  if (!parsed.success) {
    throw new UsageError(
      `"${basename(dir)}" is not a tool name: use a-z, 0-9 and "-". Pass one: forgeron init my-tool`,
    );
  }
  const name = parsed.data;

  await emptyDir(dir);
  // A tool alone in its repository says how it lives, for an agent and a person (D-121).
  const repository = marketplace ? {} : repositoryFiles(name);

  if (values.template) {
    const template = await fetchTemplate(values.template);
    await writeTemplate(dir, name, values.template, template);
    await write(dir, repository);
    io.log(`Created ${name} in ${dir} from template ${values.template}@${template.version}`);
    io.log("  forgeron dev     run it locally");
    io.log("  forgeron test    build it and run its tests");
    return 0;
  }

  // A marketplace publishes from its own workflow (release.yml); a repository deploys its branches.
  // `.forgeron/project.json` names the tool; `forgeron link` adds the workspace.
  await write(dir, toolFiles({ name, version: SDK_VERSION, repository: !marketplace }));
  if (marketplace) {
    marketplace.tools.push({
      name,
      path: `tools/${name}`,
      version: "0.1.0",
      release: null,
      asset: null,
      sha256: null,
    });
    await writeFile(
      join(io.cwd, MARKETPLACE_INDEX_PATH),
      `${JSON.stringify(marketplace, null, 2)}\n`,
    );
  }

  io.log(`Created ${name} in ${dir}`);
  io.log("  forgeron dev     run it locally");
  io.log("  forgeron test    build it and run its tests");
  io.log("  forgeron link --workspace <name>   link it to a workspace");
  return 0;
}
