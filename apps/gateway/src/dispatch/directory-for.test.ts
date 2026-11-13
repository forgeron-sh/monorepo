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
