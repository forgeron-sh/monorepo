import { formatJson, SCHEMA } from "@forgeron/blueprint/format";
import type { APIRoute } from "astro";

/**
 * The JSON Schema of `.bp` files, version 1: the URL every file names in `$schema`. Written from
 * the reference implementation's `SCHEMA`, the source of packages/blueprint/schema/blueprint.v1.json
 * (a test checks that the two say the same).
 */
export const GET: APIRoute = () =>
  new Response(formatJson(SCHEMA), {
    headers: { "Content-Type": "application/schema+json; charset=utf-8" },
  });
