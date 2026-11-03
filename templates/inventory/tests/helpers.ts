import { createTestTool as create, type TestToolOptions } from "@forgeron/sdk/testing";

// `createTestTool` runs the built tool (`.forgeron/build/`); in this monorepo Vitest runs from the
// root, so the folder is given here.
const dir = new URL("..", import.meta.url).pathname;
export const createTestTool = (options: TestToolOptions = {}) => create({ dir, ...options });

export const technician = { email: "tom@acme.fr", roles: ["technician"] };
export const reader = { email: "rae@acme.fr", roles: ["reader"] };
export const admin = { email: "ada@acme.fr", roles: ["admin"] };

export type Tool = Awaited<ReturnType<typeof createTestTool>>;

/** Two sites, created through the actions. */
export async function twoSites(tool: Tool) {
  await tool.call("sites.create", { name: "Nantes depot", city: "Nantes" });
  await tool.call("sites.create", { name: "Lyon workshop", city: "Lyon" });
}

export const CSV = [
  "ref,type,site,next_check,power_kw,serial",
  "CH-001,chiller,Nantes depot,2026-01-15,12.5,S1",
  'PU-014,pump,"lyon workshop",,,',
].join("\n");
