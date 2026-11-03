import type { Invitation, Registry } from "@forgeron/registry";
import { toBase64Url } from "./sealed";

// The link in an invitation mail carries an opaque id: a keyed hash of the invitation, so that it
// cannot be guessed, says nothing of the address, and stops working when the person is invited
// again. The id only opens the landing page; signing in still takes the code mailed to the address.

const encoder = new TextEncoder();

export async function invitationId(secret: string, invitation: Invitation): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const data = `invitation:${invitation.workspace}:${invitation.email}:${invitation.createdAt}`;
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return toBase64Url(new Uint8Array(mac).slice(0, 24));
}

export const invitationLink = (origin: string, id: string) => `${origin}/auth/invite/${id}`;

/** The pending invitation this id belongs to, with who sent it; `undefined` for any other id. */
export async function findInvitationById(
  registry: Registry,
  secret: string,
  workspace: string,
  id: string,
): Promise<{ invitation: Invitation; inviter: string } | undefined> {
  if (!/^[A-Za-z0-9_-]{32}$/.test(id)) return undefined;
  for (const invitation of await registry.listInvitations(workspace)) {
    if ((await invitationId(secret, invitation)) !== id) continue;
    const inviter = await registry.findMember(workspace, invitation.invitedBy);
    return { invitation, inviter: inviter?.name || inviter?.email || "A workspace administrator" };
  }
  return undefined;
}
