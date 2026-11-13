import { describe, expect, it } from "vitest";
import { directoryFor } from "./user-secrets";

const members = [
  { id: "m1", email: "ely@acme.fr", name: "Ely", roles: ["admin"] },
  { id: "m2", email: "sam@acme.fr", name: "Sam", roles: ["member"] },
];

describe("directoryFor", () => {
  it("hands nobody to a tool that did not ask for the members", () => {
    expect(directoryFor({ why: "x" }, members)).toEqual({ members: [] });
  });

  it("hands names and emails, and roles only when asked", () => {
    expect(directoryFor({ why: "x", members: true }, members).members[0]).toEqual({
      id: "m1",
      email: "ely@acme.fr",
      name: "Ely",
    });
    expect(
      directoryFor({ why: "x", members: true, roles: true }, members).members[1],
    ).toMatchObject({
      roles: ["member"],
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
