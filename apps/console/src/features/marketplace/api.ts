import { addresses } from "@forgeron/platform-contract/client";
import { ok, typedClient, typedSender, type FetchJson, type SendJson } from "../../api";

// The marketplaces screen's calls (D-116), through the contract's typed client. Every route is for
// admins; a read token is sent once, when a marketplace is added, and never comes back.

export async function loadMarketplaces(fetchJson: FetchJson) {
  return ok(await typedClient(fetchJson)(addresses.listMarketplaces)).marketplaces;
}
export type MarketplaceRow = Awaited<ReturnType<typeof loadMarketplaces>>[number];

export async function loadMarketplaceTools(fetchJson: FetchJson, id: string) {
  return ok(await typedClient(fetchJson)(addresses.listMarketplaceTools, { params: { id } })).tools;
}

export async function loadMarketplaceToolCard(fetchJson: FetchJson, id: string, tool: string) {
  return ok(await typedClient(fetchJson)(addresses.marketplaceToolCard, { params: { id, tool } }));
}
export type MarketplaceToolCard = Awaited<ReturnType<typeof loadMarketplaceToolCard>>;

export async function addMarketplace(send: SendJson, repo: string, token: string | undefined) {
  return ok(
    await typedSender(send)(addresses.addMarketplace, {
      json: { repo, ...(token ? { token } : {}) },
    }),
  );
}

export async function removeMarketplace(send: SendJson, id: string) {
  ok(await typedSender(send)(addresses.removeMarketplace, { params: { id } }));
}

export async function syncMarketplace(send: SendJson, id: string) {
  return ok(await typedSender(send)(addresses.syncMarketplace, { params: { id } }));
}
export type SyncAnswer = Awaited<ReturnType<typeof syncMarketplace>>;

export async function installMarketplaceTool(send: SendJson, id: string, tool: string) {
  return ok(await typedSender(send)(addresses.installMarketplaceTool, { params: { id, tool } }));
}

export const marketplaceLabel = (m: MarketplaceRow) =>
  m.official ? "Official" : (m.title ?? m.repo ?? m.id);

export const toolSheetPath = (id: string, tool: string) =>
  `/admin/marketplace/${encodeURIComponent(id)}/${encodeURIComponent(tool)}`;
