import { describe, expect, it } from "vitest";
import type { Person } from "../kernel/person";
import { forwardIdentity, type UserSecretsContext } from "./user-secrets";

const person = {
  id: "p1",
  email: "ada@acme.test",
  name: "Ada",
  teams: ["ops"],
  subjects: ["everyone", "team:ops"],
  permissions: [],
} as unknown as Person;

/**
 * A registry whose manifest answers late, and that writes down what is read and when: what is read
 * before the manifest has answered was asked at the same time as it.
 */
function context(toolId: string, directory: Record<string, unknown> | undefined) {
  const reads: string[] = [];
  let manifestAnswered = false;
  const note = (name: string) => reads.push(manifestAnswered ? `${name} (after)` : name);
  const registry = {
    async findTool() {
      return { id: toolId, workspace: "acme", name: "notes" };
    },
    async currentManifest() {
      manifestAnswered = false;
      await new Promise((resolve) => setTimeout(resolve, 5));
      manifestAnswered = true;
      return { resources: directory ? { directory } : {} };
    },
    async accessFor() {
      return { access: {}, permissions: {} };
    },
    async availabilityOf() {
      return undefined;
    },
    async readUserSecrets() {
      return {};
    },
    async readUserSetup() {
      return {};
    },
    async findMember() {
      note("member");
      return { id: "p1", avatar: { version: "v1" } };
    },
    async listMembers() {
      note("members");
      return [{ id: "p1", email: "ada@acme.test", name: "Ada" }];
    },
    async listTeams() {
      note("teams");
      return [{ id: "ops", name: "Ops", description: "", members: ["p1"] }];
    },
  };
  const ctx = {
    registry,
    workspace: "acme",
    identify: async () => ({ person }),
  } as unknown as UserSecretsContext;
  const call = () =>
    forwardIdentity("notes", new Request("https://acme.forgeron.app/t/notes/mcp"), ctx);
  return { call, reads };
}

describe("the directory a call forwards (D-145)", () => {
  it("is read at the same time as the manifest that asks for it", async () => {
    const { call, reads } = context("t-ahead", {
      why: "x",
      members: true,
      avatars: true,
      teams: true,
    });
    const forwarded = await call();
    expect(reads.sort()).toEqual(["member", "members", "teams"]);
    const headers = (forwarded as { headers: Record<string, string> }).headers;
    expect(JSON.parse(headers["x-forgeron-directory"]!).teams).toHaveLength(1);
  });

  it("sends nothing of what was read ahead to a tool that asks for no directory", async () => {
    const { call } = context("t-none", undefined);
    const forwarded = (await call()) as { headers: Record<string, string> };
    expect(forwarded.headers["x-forgeron-directory"]).toBeUndefined();
    expect(JSON.parse(forwarded.headers["x-forgeron-user"]!).teams).toBeUndefined();
  });

  it("is not read again for a tool this Worker saw ask for none", async () => {
    const { call, reads } = context("t-none-twice", undefined);
    await call();
    reads.length = 0;
    await call();
    expect(reads).toEqual([]);
  });

  it("reads only what a tool seen before asks for, ahead of its manifest", async () => {
    const { call, reads } = context("t-members", { why: "x", members: true });
    await call();
    reads.length = 0;
    const forwarded = (await call()) as { headers: Record<string, string> };
    expect(reads).toEqual(["members"]);
    expect(JSON.parse(forwarded.headers["x-forgeron-directory"]!).teams).toBeUndefined();
  });
});
