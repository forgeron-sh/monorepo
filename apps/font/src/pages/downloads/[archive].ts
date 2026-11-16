import type { APIRoute, GetStaticPaths } from "astro";
import { loadSpecimen } from "../../lib/specimen";

/** The archive of the three font files and the licence, written at build time. */
export const getStaticPaths: GetStaticPaths = () => [
  { params: { archive: loadSpecimen().specimen.archive.name } },
];

export const GET: APIRoute = () =>
  new Response(loadSpecimen().archive, { headers: { "Content-Type": "application/zip" } });
