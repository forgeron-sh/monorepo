import type { Manifest } from "@forgeron/manifest";
import { describe, expect, it } from "vitest";
import { createDirectory } from "./directory";
import type { DirectorySnapshot, User } from "./types";

const me: User = {
  id: "u1",
  email: "ely@acme.fr",
  name: "Ely",
  subjects: ["everyone", "team:t1"],
  teams: ["t1"],
};
const snapshot: DirectorySnapshot = {
  members: [
    {
      id: "u1",
      email: "ely@acme.fr",
      name: "Ely",
      avatar: "https://x/e.png",
      teams: ["t1"],
    },
    {
      id: "u2",
      email: "sam@acme.fr",
      name: "Sam Martin",
      avatar: "https://x/s.png",
      teams: ["t2"],
    },
  ],
  teams: [
    { id: "t1", name: "Product", members: ["u1"] },
    { id: "t2", name: "Sales", members: ["u2"] },
  ],
};
const decl = (d: NonNullable<Manifest["resources"]["directory"]>) => d;

describe("ctx.directory", () => {
  it("gives the caller and nothing else when nothing is declared", async () => {
    const dir = createDirectory(undefined, snapshot, me);
    expect(dir.me()).toEqual({ id: "u1", email: "ely@acme.fr", name: "Ely" });
    expect(await dir.member("ely@acme.fr")).toMatchObject({ id: "u1" });
    await expect(dir.members()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(dir.member("sam@acme.fr")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(dir.teams()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("lists members with only the fields that were asked for", async () => {
    const dir = createDirectory(decl({ why: "invite", members: true }), snapshot, me);
    expect(await dir.members()).toEqual([
      { id: "u1", email: "ely@acme.fr", name: "Ely" },
      { id: "u2", email: "sam@acme.fr", name: "Sam Martin" },
    ]);
    const full = createDirectory(
      decl({ why: "invite", members: true, avatars: true }),
      snapshot,
      me,
    );
    expect((await full.member("SAM@acme.fr"))?.teams).toBeUndefined();
    expect((await full.member("u2"))?.avatar).toBe("https://x/s.png");
  });

  it("searches by name or email and finds nobody outside the workspace", async () => {
    const dir = createDirectory(decl({ why: "invite", members: true }), snapshot, me);
    expect((await dir.members({ query: "martin" })).map((m) => m.id)).toEqual(["u2"]);
    expect(await dir.member("stranger@elsewhere.com")).toBeUndefined();
  });

  it("knows the teams only when asked, and which the caller is in", async () => {
    const dir = createDirectory(decl({ why: "teams", members: true, teams: true }), snapshot, me);
    expect((await dir.teams()).map((t) => t.id)).toEqual(["t1", "t2"]);
    expect((await dir.teams({ mine: true })).map((t) => t.id)).toEqual(["t1"]);
    expect(dir.inTeam("t1")).toBe(true);
    expect(dir.inTeam("t2")).toBe(false);
    expect((await dir.members({ team: "t2" })).map((m) => m.id)).toEqual(["u2"]);
  });
});
