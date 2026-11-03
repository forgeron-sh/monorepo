import { ToolNameSchema } from "@forgeron/manifest";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { UsageError, type Io } from "../io";
import { writeProject } from "../project";
import { WORKFLOW, WORKFLOW_PATH } from "../workflow";
import { fetchTemplate, SDK_VERSION, VITEST_VERSION, writeTemplate } from "../template";

// `forgeron init [name] [--template crm]`: a tool of one action, with its test and its `.forgeron/`.

export async function init(args: string[], io: Io): Promise<number> {
  const { positionals, values } = parseArgs({
    args,
    allowPositionals: true,
    options: { template: { type: "string" } },
  });
  if (positionals.length > 1) throw new UsageError("Usage: forgeron init [name]");

  const dir = positionals[0] ? resolve(io.cwd, positionals[0]) : io.cwd;
  const parsed = ToolNameSchema.safeParse(basename(dir));
  if (!parsed.success) {
    throw new UsageError(
      `"${basename(dir)}" is not a tool name: use a-z, 0-9 and "-". Pass one: forgeron init my-tool`,
    );
  }
  const name = parsed.data;

  await mkdir(dir, { recursive: true });
  if ((await readdir(dir)).length > 0) {
    throw new UsageError(`${dir} is not empty: \`forgeron init\` does not overwrite a folder.`);
  }

  if (values.template) {
    const template = await fetchTemplate(values.template);
    await writeTemplate(dir, name, values.template, template);
    io.log(`Created ${name} in ${dir} from template ${values.template}@${template.version}`);
    io.log("  forgeron dev     run it locally");
    io.log("  forgeron test    build it and run its tests");
    return 0;
  }

  const files: Record<string, string> = {
    "package.json": `${JSON.stringify(
      {
        name,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: { build: "forgeron build", dev: "forgeron dev", test: "forgeron test" },
        dependencies: { "@forgeron/sdk": SDK_VERSION },
        devDependencies: { vitest: VITEST_VERSION },
      },
      null,
      2,
    )}\n`,
    "forgeron.config.ts": `import { defineConfig } from "@forgeron/sdk";

export default defineConfig({
  name: "${name}",
  title: "${name}",
  roles: { reader: { grants: ["read"] } },
});
`,
    "actions/ping.ts": `import { action, z } from "@forgeron/sdk";

export default action({
  description: "Answers pong: a first action to replace.",
  access: "read",
  input: z.object({}),
  run: () => ({ pong: true }),
});
`,
    "tests/ping.test.ts": `import { createTestTool } from "@forgeron/sdk/testing";
import { expect, it } from "vitest";

it("answers pong", async () => {
  const tool = await createTestTool();
  expect(await tool.call("ping")).toEqual({ pong: true });
});
`,
    "changes/.gitkeep": "",
    ".forgeron/.gitignore": "local/\ngenerated/\nbuild/\n",
    [WORKFLOW_PATH]: WORKFLOW,
  };
  for (const [path, content] of Object.entries(files)) {
    await mkdir(join(dir, path, ".."), { recursive: true });
    await writeFile(join(dir, path), content);
  }
  await writeProject(dir, { tool: name });

  io.log(`Created ${name} in ${dir}`);
  io.log("  forgeron dev     run it locally");
  io.log("  forgeron test    build it and run its tests");
  io.log("  forgeron link --workspace <name>   link it to a workspace");
  return 0;
}
