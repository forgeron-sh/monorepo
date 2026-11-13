import { ToolNameSchema } from "@forgeron/manifest";
import { existsSync } from "node:fs";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { startPlay } from "../play";
import { NotFoundError, UsageError, type Io } from "../io";
import { fetchTemplate, TemplateNotFoundError, writeTemplate } from "../template";
import { watchSources } from "../watch";

const DEFAULT_PORT = 8788;

const opener = () =>
  process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";

/** The `node_modules` that holds `@forgeron/sdk` next to this CLI, for a template staged outside any project. */
function sdkModules(): string | undefined {
  for (let dir = import.meta.dirname; dir !== dirname(dir); dir = dirname(dir)) {
    if (existsSync(join(dir, "node_modules/@forgeron/sdk"))) return join(dir, "node_modules");
  }
  return undefined;
}

/** Downloads the template into a scratch folder, away from the workspace. */
async function stageTemplate(templateName: string): Promise<{ dir: string; version: string }> {
  const parsed = ToolNameSchema.safeParse(templateName);
  if (!parsed.success) {
    throw new UsageError(`"${templateName}" is not a template name: use a-z, 0-9 and "-".`);
  }
  const template = await fetchTemplate(templateName).catch((error: unknown) => {
    throw error instanceof TemplateNotFoundError ? new NotFoundError(error.message) : error;
  });
  const dir = await mkdtemp(join(tmpdir(), "forgeron-play-"));
  try {
    await writeTemplate(dir, parsed.data, templateName, template);
    const modules = sdkModules();
    if (modules) await symlink(modules, join(dir, "node_modules"), "dir");
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
  return { dir, version: template.version };
}

/** `forgeron play [--template <name>] [--as <profile>|all] [--team <id>]... [--port 8788] [--no-open]`: the playground of the tool, until stopped. */
export async function play(args: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      template: { type: "string" },
      as: { type: "string" },
      team: { type: "string", multiple: true },
      port: { type: "string" },
      "no-open": { type: "boolean" },
    },
  });
  if (positionals.length > 0)
    throw new UsageError(
      "Usage: forgeron play [--template <name>] [--as <profile>|all] [--team <id>]... [--port 8788] [--no-open]",
    );
  const port = values.port === undefined ? DEFAULT_PORT : Number(values.port);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new UsageError(`--port ${values.port}: not a port number.`);
  }

  // With --template the tool is a scratch copy: nothing is written in the workspace.
  const staged = values.template ? await stageTemplate(values.template) : undefined;
  try {
    return await serve(
      staged?.dir ?? io.cwd,
      port,
      values,
      io,
      staged && `${values.template}@${staged.version}`,
    );
  } finally {
    if (staged) await rm(staged.dir, { recursive: true, force: true });
  }
}

async function serve(
  dir: string,
  port: number,
  values: {
    as?: string | undefined;
    team?: string[] | undefined;
    "no-open"?: boolean | undefined;
  },
  io: Io,
  template: string | undefined,
): Promise<number> {
  const session = await startPlay(dir, {
    playPort: port,
    ...(values.as ? { as: values.as } : {}),
    ...(values.team ? { teams: values.team } : {}),
  }).catch((error: unknown) => {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === "EADDRINUSE") {
      throw new UsageError(`Port ${port} is already in use: pick another with --port.`);
    }
    throw error;
  });

  if (template) io.log(`Template ${template}, run from a scratch copy: nothing is installed.`);
  io.log(`Playground of ${session.name}: ${session.url}`);
  if (!values["no-open"]) await io.exec(opener(), [session.url], io.cwd).catch(() => 1);

  const stopWatching = watchSources(dir, () => {
    session.reload().then(
      () => io.log("rebuilt"),
      (error: unknown) =>
        io.error(`build failed, still serving the previous build:\n${String(error)}`),
    );
  });
  await io.stopped;
  stopWatching();
  await session.stop();
  return 0;
}
