import { createTestTool as create, type TestToolOptions } from "@forgeron/sdk/testing";
import type { Deal } from "../lib/crm";

// `createTestTool` runs the built tool (`.forgeron/build/`); in this monorepo Vitest runs from the
// root, so the folder is given here.
const dir = new URL("..", import.meta.url).pathname;
export const createTestTool = (options: TestToolOptions = {}) => create({ dir, ...options });

export const NOW = "2026-11-03T09:00:00Z";

export const management = { email: "mia@acme.fr", profile: "management" };
export const nobody = { email: "sam@acme.fr", permissions: [] };

const deal = (id: string, over: Partial<Deal>): Deal => ({
  id,
  title: `Deal ${id}`,
  stage: "lead",
  amount: null,
  owner_email: "ely@acme.fr",
  company: "Acme",
  updated_at: "2026-11-01T10:00:00.000Z",
  ...over,
});

/** What the CRM's `deals.list` would answer (the CRM is simulated: its data is not copied here). */
const DEALS: Deal[] = [
  deal("1", { stage: "won", amount: 10_000, updated_at: "2026-11-02T08:00:00.000Z" }),
  deal("2", { stage: "won", amount: 5_000, updated_at: "2026-10-20T08:00:00.000Z" }),
  deal("3", { stage: "proposal", amount: 20_000 }),
  deal("4", { stage: "lead", updated_at: "2026-09-01T00:00:00.000Z", company: "Globex" }),
  deal("5", { stage: "lead", updated_at: "2026-10-01T00:00:00.000Z", owner_email: "sam@acme.fr" }),
  deal("6", { stage: "lost", updated_at: "2026-01-01T00:00:00.000Z" }),
];

/** A simulated CRM that applies the `owner` filter like the real one. */
export const crm = {
  crm: {
    "deals.list": (input: unknown) => {
      const { owner } = (input ?? {}) as { owner?: string };
      return owner ? DEALS.filter((d) => d.owner_email === owner) : DEALS;
    },
  },
};
