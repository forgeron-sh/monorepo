import { ManifestSchema, ToolNameSchema } from "@forgeron/manifest";
import { mkdir, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { UsageError, type Io } from "../io";
import { describeResources } from "../resources";
import { fetchTemplate, TEMPLATE_MANIFEST, writeTemplate } from "../template";

/**
 * `forgeron install <template> [--name <tool>] [--yes]`: shows what the template requests, and only
 * after approval writes the tool into `./<name>`. Linking it to a workspace stays `forgeron link`.
 */
export async function install(args: string[], io: Io): Promise<number> {
  const { positionals, values } = parseArgs({
    args,
    allowPositionals: true,
    options: { name: { type: "string" }, yes: { type: "boolean" } },
  });
  const [templateName, ...extra] = positionals;
  if (!templateName || extra.length > 0) {
    throw new UsageError("Usage: forgeron install <template> [--name <tool>] [--yes]");
  }
  const parsed = ToolNameSchema.safeParse(values.name ?? templateName);
  if (!parsed.success) {
    throw new UsageError(
      `"${values.name ?? templateName}" is not a tool name: use a-z, 0-9 and "-". Pass one with --name.`,
    );
  }
  const name = parsed.data;
  const dir = resolve(io.cwd, name);
  await mkdir(dir, { recursive: true });
  if ((await readdir(dir)).length > 0) {
    throw new UsageError(`${dir} is not empty: \`forgeron install\` does not overwrite a folder.`);
  }

  const template = await fetchTemplate(templateName);
  const raw = template.files.get(TEMPLATE_MANIFEST);
  const manifest = raw && ManifestSchema.safeParse(JSON.parse(new TextDecoder().decode(raw)));
  if (!manifest?.success) {
    io.error(
      `Template ${templateName}@${template.version} ships no readable manifest: its resources cannot be shown, so nothing was installed.`,
    );
    return 1;
  }

  for (const line of describeResources(manifest.data)) io.log(line);
  const approved =
    values.yes === true || (await io.confirm?.(`Install ${templateName} as ${name}?`));
  if (!approved) {
    io.error(
      io.confirm
        ? "Not approved: nothing was installed."
        : "Nothing was installed: no terminal to ask on, pass --yes to approve these resources.",
    );
    return 1;
  }

  await writeTemplate(dir, name, templateName, template);
  io.log(`Installed ${name} in ${dir} from template ${templateName}@${template.version}`);
  io.log("  forgeron link --workspace <name>   link it to a workspace");
  return 0;
}
