import { createTestTool as create, type TestToolOptions } from "@forgeron/sdk/testing";

// `createTestTool` runs the built tool (`.forgeron/build/`), found from the current directory:
// `forgeron test` runs Vitest from the tool folder. In this monorepo Vitest runs from the root,
// so the folder is given here.
const dir = new URL("..", import.meta.url).pathname;
export const createTestTool = (options: TestToolOptions = {}) => create({ dir, ...options });

export const sales = { email: "ely@acme.fr", roles: ["sales"] };
export const support = { email: "sam@acme.fr", roles: ["support"] };
export const management = { email: "mia@acme.fr", roles: ["management"] };

type Tool = Awaited<ReturnType<typeof createTestTool>>;

/** A company and a lead for it, created through the actions. */
export async function aLead(tool: Tool, title = "Renewal") {
  const company = (await tool.call("companies.upsert", { name: "Acme", domain: "acme.fr" })) as {
    id: string;
  };
  const deal = (await tool.call("deals.create", { company_id: company.id, title })) as {
    id: string;
  };
  return { company: company.id, deal: deal.id };
}
