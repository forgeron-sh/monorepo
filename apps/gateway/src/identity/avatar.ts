import type { Registry } from "@forgeron/registry";

// The picture a member has at their identity provider (D-133): copied when they sign in, so that the
// console and the tools show it from the platform (the console's CSP allows no other image host, and
// a viewer's address is not told to the provider). Best effort: a sign-in never fails for a picture.

const MAX_BYTES = 64 * 1024;
const TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

/** The picture at `url` as a data URL, or `undefined` when it is not a small png, jpeg or webp. */
export async function fetchPicture(
  url: string,
  fetchImage: (url: string, init: { signal: AbortSignal }) => Promise<Response> = fetch,
): Promise<string | undefined> {
  let address: URL;
  try {
    address = new URL(url);
  } catch {
    return undefined;
  }
  if (address.protocol !== "https:" || url.length > 500) return undefined;
  try {
    const response = await fetchImage(address.href, { signal: AbortSignal.timeout(3000) });
    const type = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
    if (!response.ok || !TYPES.has(type)) return undefined;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_BYTES) return undefined;
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return `data:${type};base64,${btoa(binary)}`;
  } catch {
    return undefined;
  }
}

/** Copies the provider's picture when it is new; a person's own choice is untouched (it wins at serving). */
export async function refreshProviderAvatar(
  registry: Pick<Registry, "providerAvatarUrl" | "setProviderAvatar">,
  workspace: string,
  memberId: string,
  picture: string | undefined,
  fetchImage?: Parameters<typeof fetchPicture>[1],
): Promise<void> {
  if (!picture) return;
  try {
    if ((await registry.providerAvatarUrl(workspace, memberId)) === picture) return;
    const dataUrl = await fetchPicture(picture, fetchImage);
    if (dataUrl) await registry.setProviderAvatar(workspace, memberId, { url: picture, dataUrl });
  } catch {
    // Never fail a sign-in for a picture.
  }
}

/**
 * `GET /avatars/<member id>`: the picture of a member of this workspace (D-133). Public on purpose: a tool's
 * page is sandboxed and sends no cookie, so an `<img>` could not sign in. The id is random, the address
 * carries the picture's version (`?v=`) so that it can be cached for good, and only an image is served.
 */
export async function serveAvatar(
  registry: Pick<Registry, "readAvatar">,
  workspace: string,
  memberId: string,
  head = false,
): Promise<Response> {
  const found = await registry.readAvatar(workspace, memberId);
  if (!found) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }
  return new Response(head ? null : found.bytes, {
    headers: {
      "content-type": found.contentType,
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; sandbox",
      "cross-origin-resource-policy": "cross-origin",
    },
  });
}
