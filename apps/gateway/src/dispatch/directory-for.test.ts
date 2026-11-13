import { describe, expect, it } from "vitest";
import { directoryFor } from "./user-secrets";

const members = [
  { id: "m1", email: "ely@acme.fr", name: "Ely" },
  { id: "m2", email: "sam@acme.fr", name: "Sam" },
];

describe("directoryFor", () => {
  it("hands nobody to a tool that did not ask for the members", () => {
    expect(directoryFor({ why: "x" }, members)).toEqual({ members: [] });
  });

  it("hands names and emails only", () => {
    expect(directoryFor({ why: "x", members: true }, members).members[0]).toEqual({
      id: "m1",
      email: "ely@acme.fr",
      name: "Ely",
    });
  });
});

describe("directoryFor with teams", () => {
  const teams = [
    { id: "product", name: "Product", description: "", members: ["m1"] },
    { id: "sales", name: "Sales", description: "The field", members: ["m2"] },
  ];

  it("gives teams, and each member's teams, only to a tool that asked for them", () => {
    expect(directoryFor({ why: "x", members: true }, members, teams).teams).toBeUndefined();
    const given = directoryFor({ why: "x", members: true, teams: true }, members, teams);
    expect(given.teams?.map((t) => t.id)).toEqual(["product", "sales"]);
    expect(given.members[0]).toMatchObject({ teams: ["product"] });
  });

  it("does not say who is in a team to a tool that did not ask for the members", () => {
    const given = directoryFor({ why: "x", teams: true }, members, teams);
    expect(given.members).toEqual([]);
    expect(given.teams?.[0]).toMatchObject({ id: "product", members: [] });
  });
});

describe("directoryFor with pictures", () => {
  const withAvatar = [{ ...members[0]!, avatar: { version: "v1" } }, members[1]!];

  it("gives the address of a picture only to a tool that asked for pictures", () => {
    expect(
      directoryFor({ why: "x", members: true }, withAvatar, [], "https://acme.test").members[0],
    ).not.toHaveProperty("avatar");
    const given = directoryFor(
      { why: "x", members: true, avatars: true },
      withAvatar,
      [],
      "https://acme.test",
    );
    expect(given.members[0]).toMatchObject({ avatar: "https://acme.test/avatars/m1?v=v1" });
    expect(given.members[1]).not.toHaveProperty("avatar");
  });
});
