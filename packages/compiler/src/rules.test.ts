import type { Manifest } from "@forgeron/manifest";
import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { buildTool } from "./index";
import { findUndeclaredResources } from "./check";

// The failure rules of the build (sdk.md §14): each one refuses a tool with a message that
// names the file, the action or the resource at fault.

const tool = (name: string) => fileURLToPath(new URL(`../fixtures/rules/${name}`, import.meta.url));

describe("an action without a description or an access level", () => {
  it("is refused, naming the file", async () => {
    await expect(buildTool(tool("no-description"))).rejects.toThrow(
      /actions\/ping\.ts: An action needs a description\./,
    );
  }, 60_000);

  it("is refused when it has no access level", async () => {
    await expect(buildTool(tool("no-access"))).rejects.toThrow(/actions\/ping\.ts: .*access level/);
  }, 60_000);
});

describe("an action name declared twice", () => {
  it("names both files", async () => {
    await expect(buildTool(tool("duplicate"))).rejects.toThrow(
      /Two files declare the action "a\.b": actions\/a\.b\.ts and actions\/a\/b\.ts\./,
    );
  }, 60_000);
});

describe("an action nested more than two levels", () => {
  it("is refused, naming the file", async () => {
    await expect(buildTool(tool("too-deep"))).rejects.toThrow(
      /a\/b\/c\.ts: an action is at most two levels deep \(group\.verb\)\./,
    );
  }, 60_000);
});

describe("an import that leaves the tool", () => {
  it("is refused, naming the file and the import", async () => {
    await expect(buildTool(tool("outside-import"))).rejects.toThrow(
      /actions\/x\.ts imports "\.\.\/\.\.\/shared-outside", which is outside the tool folder/,
    );
  }, 60_000);

  it("lets npm and workspace packages and the tool's own files through", async () => {
    // `declared-ok` imports `@forgeron/sdk`; the `hello` fixture imports its own `lib/`.
    await expect(buildTool(tool("declared-ok"))).resolves.toMatchObject({ name: "declared-ok" });
  }, 60_000);
});

describe("code that uses what the config does not declare", () => {
  it("refuses ctx.db without resources.db", async () => {
    await expect(buildTool(tool("undeclared-db"))).rejects.toThrow(
      /"undeclared-db" uses what it does not declare:\n {2}- actions\/ping\.ts: ctx\.db is used but resources\.db is not declared in forgeron\.config\.ts\./,
    );
  }, 60_000);

  it("refuses a secret that is not in resources.secrets", async () => {
    await expect(buildTool(tool("undeclared-secret"))).rejects.toThrow(
      /ctx\.secrets\.API_KEY is used but "API_KEY" is not declared in resources\.secrets\./,
    );
  }, 60_000);

  it("refuses a tool that is not in `uses`", async () => {
    await expect(buildTool(tool("undeclared-uses"))).rejects.toThrow(
      /ctx\.tools\.crm is used but "crm" is not declared in uses\./,
    );
  }, 60_000);

  it("accepts what is declared, and ignores comments", async () => {
    await expect(buildTool(tool("declared-ok"))).resolves.toBeDefined();
  }, 60_000);
});

describe("findUndeclaredResources", () => {
  const manifest = {
    name: "t",
    resources: { cache: {}, secrets: { A: {} }, connectors: { ms: {} } },
    uses: { crm: "^1.0.0" },
  } as unknown as Manifest;

  it("reads every member of ctx", () => {
    const source = "ctx.files; ctx.userSecrets.X; ctx.connectors.slack; ctx.db";
    expect(findUndeclaredResources(source, manifest)).toEqual([
      "ctx.files is used but resources.files is not declared in forgeron.config.ts.",
      "ctx.userSecrets is used but resources.userSecrets is not declared in forgeron.config.ts.",
      'ctx.connectors.slack is used but "slack" is not declared in resources.connectors.',
      "ctx.db is used but resources.db is not declared in forgeron.config.ts.",
    ]);
  });

  it("accepts the declared ones, and says each problem once", () => {
    expect(
      findUndeclaredResources("ctx.cache.get(); ctx.secrets.A; ctx.tools.crm", manifest),
    ).toEqual([]);
    expect(findUndeclaredResources("ctx.db; ctx.db.x; ctx.db", manifest)).toHaveLength(1);
  });

  it("ignores comments and similar words", () => {
    const source = "// ctx.db\n/* ctx.files */\nconst mctx = 1; mctx.db; ctx.input.db; ctx.now()";
    expect(findUndeclaredResources(source, manifest)).toEqual([]);
  });
});
