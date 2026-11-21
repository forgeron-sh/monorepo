import type { APIRoute, GetStaticPaths } from "astro";
import { entries, registryFor } from "../../lib/shadcn/registry";
import { BASE_ITEM, THEME_ITEM } from "../../lib/shadcn/build";

// One shadcn registry item per gallery entry, plus `forgeron` (shared) and `forgeron-theme` (D-156):
// `npx shadcn add https://ui.forgeron.sh/r/<name>.json`.
export const getStaticPaths: GetStaticPaths = () =>
  [BASE_ITEM, THEME_ITEM, ...entries.map((e) => e.slug)].map((name) => ({ params: { name } }));

export const GET: APIRoute = ({ params, site }) => {
  const item = registryFor(site).items.get(String(params.name));
  if (!item) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(item, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
