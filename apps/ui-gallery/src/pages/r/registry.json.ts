import type { APIRoute } from "astro";
import { registryFor } from "../../lib/shadcn/registry";

// The index of the shadcn registry (D-156), for `shadcn search` and `shadcn view` on `@forgeron`.
export const GET: APIRoute = ({ site }) =>
  new Response(JSON.stringify(registryFor(site).index, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
