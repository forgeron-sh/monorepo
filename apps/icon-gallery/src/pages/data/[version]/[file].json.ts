import type { APIRoute, GetStaticPaths } from "astro";
import { catalogData } from "../../../lib/data";

// The data files of the gallery, written at build time: `index.json` and one file per batch.

export const getStaticPaths: GetStaticPaths = () => {
  const { version, batches } = catalogData();
  return [
    { params: { version, file: "index" } },
    ...batches.map((_, i) => ({ params: { version, file: String(i) } })),
  ];
};

export const GET: APIRoute = ({ params }) => {
  const { index, batches } = catalogData();
  const body = params.file === "index" ? index : batches[Number(params.file)];
  if (!body) return new Response(null, { status: 404 });
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
