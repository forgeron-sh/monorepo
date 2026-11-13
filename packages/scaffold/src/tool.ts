// The files of a new tool (D-121, D-123): what `forgeron init` writes on disk and what the gateway
// commits into a repository it creates. Pure: no file system, so that both can use it.
import { CLAUDE_MD, toolAgents } from "./agents";
import { LIFECYCLE, LIFECYCLE_PATH } from "./lifecycle";
import { workflow, WORKFLOW_PATH } from "./workflow";

/** The test runner a new tool runs its tests with. */
export const VITEST_VERSION = "5.0.5";

export const PROJECT_PATH = ".forgeron/project.json";

/** What makes a repository a tool's own (as opposed to a folder of a marketplace). */
export function repositoryFiles(name: string): Record<string, string> {
  return { "AGENTS.md": toolAgents(name), "CLAUDE.md": CLAUDE_MD, [LIFECYCLE_PATH]: LIFECYCLE };
}

/** `.forgeron/project.json`: the tool, and the workspace's address when it is known. */
export function projectFile(project: { tool: string; endpoint?: string }): string {
  return `${JSON.stringify(project, null, 2)}\n`;
}

/**
 * A tool of one action, with its test: `version` is the SDK and CLI it is made for (the release that
 * writes it, D-122). In a repository of its own (`repository`, by default) it also has its workflow,
 * AGENTS.md, CLAUDE.md and docs/lifecycle.md; in a marketplace, the marketplace publishes it.
 */
export function toolFiles(options: {
  name: string;
  version: string;
  endpoint?: string;
  repository?: boolean;
}): Record<string, string> {
  const { name, version } = options;
  const repository = options.repository ?? true;
  return {
    "package.json": `${JSON.stringify(
      {
        name,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: { build: "forgeron build", dev: "forgeron dev", test: "forgeron test" },
        dependencies: { "@forgeron/sdk": version },
        devDependencies: { forgeron: version, vitest: VITEST_VERSION },
      },
      null,
      2,
    )}\n`,
    "forgeron.config.ts": `import { defineConfig } from "@forgeron/sdk";

export default defineConfig({
  name: "${name}",
  title: "${name}",
  // Profiles: what the tool suggests; whoever gives access picks one for everyone and for each team (D-137).
  profiles: { user: { label: "User", grants: ["read"], default: true } },
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
    [PROJECT_PATH]: projectFile({
      tool: name,
      ...(options.endpoint ? { endpoint: options.endpoint } : {}),
    }),
    ...(repository
      ? {
          [WORKFLOW_PATH]: workflow({ version }),
          ...repositoryFiles(name),
        }
      : {}),
  };
}
