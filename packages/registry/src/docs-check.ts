// A build is a request body: the platform checks its documentation again before it stores or serves a
// byte of it (D-061). The compiler already did, but nothing the sender says about itself is trusted.
import type { BuildDocs } from "@forgeron/hosting";
import {
  DOC_IMAGE_TYPES,
  isSafeDocPath,
  MAX_FILE,
  MAX_TOTAL,
  svgProblem,
  type Manifest,
} from "@forgeron/manifest";

const hex = async (bytes: Uint8Array): Promise<string> =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

/** What is wrong with the documentation of a build, or `undefined`. Also compares it with the manifest. */
export async function docsProblem(
  manifest: Pick<Manifest, "docs">,
  docs: BuildDocs | undefined,
): Promise<string | undefined> {
  if (docs === undefined) return undefined;
  if (
    typeof docs !== "object" ||
    docs === null ||
    !Array.isArray(docs.assets) ||
    (docs.readme !== undefined && typeof docs.readme !== "string")
  ) {
    return "docs: a README (text) and a list of images.";
  }
  const listed = manifest.docs;
  if (!listed) return "docs: the manifest lists no documentation.";
  const encoder = new TextEncoder();
  let total = 0;
  if (docs.readme !== undefined) {
    const bytes = encoder.encode(docs.readme);
    if (bytes.length > MAX_FILE) return `docs: the README is over ${MAX_FILE} bytes.`;
    if (!listed.readme || listed.readme.hash !== (await hex(bytes))) {
      return "docs: the README is not the one the manifest lists.";
    }
    total += bytes.length;
  }
  const seen = new Set<string>();
  for (const asset of docs.assets) {
    const where = `docs: ${typeof asset?.path === "string" ? asset.path : "an image"}`;
    if (typeof asset?.path !== "string" || !isSafeDocPath(asset.path)) {
      return `${where} is not a path inside the tool folder.`;
    }
    if (seen.has(asset.path)) return `${where} is listed twice.`;
    seen.add(asset.path);
    const extension = asset.path.split(".").pop()!.toLowerCase();
    const type = DOC_IMAGE_TYPES[extension as keyof typeof DOC_IMAGE_TYPES];
    if (!type || asset.type !== type) return `${where} is not an allowed image type.`;
    let bytes: Uint8Array;
    try {
      bytes = Uint8Array.from(atob(String(asset.base64)), (c) => c.charCodeAt(0));
    } catch {
      return `${where} is not base64.`;
    }
    if (bytes.length > MAX_FILE) return `${where} is over ${MAX_FILE} bytes.`;
    total += bytes.length;
    if (total > MAX_TOTAL) return `docs: over ${MAX_TOTAL} bytes in total.`;
    if (bytes.length !== asset.size) return `${where}: the size does not match the content.`;
    const hash = await hex(bytes);
    if (hash !== asset.hash) return `${where}: the hash does not match the content.`;
    const entry = listed.assets.find((a) => a.path === asset.path);
    if (!entry || entry.hash !== hash) return `${where} is not the one the manifest lists.`;
    if (extension === "svg") {
      const problem = svgProblem(new TextDecoder().decode(bytes));
      if (problem) return `${where}: this SVG is refused, ${problem}.`;
    }
  }
  if (listed.assets.some((a) => !seen.has(a.path))) {
    return "docs: the manifest lists an image that was not sent.";
  }
  return undefined;
}
