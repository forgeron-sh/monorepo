import type { APIRoute } from "astro";
import { licenceBytes } from "../lib/specimen";

/** The licence of the font, built from the single licence constant (`src/config/licence.ts`). */
export const GET: APIRoute = () =>
  new Response(licenceBytes(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
