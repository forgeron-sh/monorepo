import { describe, expect, it } from "vitest";
import { readGatewayUser } from "./gateway-user";

describe("readGatewayUser", () => {
  const person = { id: "u1", email: "a@x.fr", name: "A" };

  it("reads the subjects the gateway sends", () => {
    const raw = JSON.stringify({ ...person, subjects: ["everyone", "team:sales"] });
    expect(readGatewayUser(raw)).toEqual({ ...person, subjects: ["everyone", "team:sales"] });
  });

  it("reads the roles of a gateway from before D-136 as subjects", () => {
    const raw = JSON.stringify({ ...person, roles: ["admin", "member"], access: { admin: {} } });
    expect(readGatewayUser(raw)).toEqual({
      ...person,
      subjects: ["admin", "member"],
      access: { admin: {} },
    });
  });

  it("prefers the subjects when both are there", () => {
    const raw = JSON.stringify({ ...person, subjects: ["everyone"], roles: ["admin"] });
    expect(readGatewayUser(raw)?.subjects).toEqual(["everyone"]);
  });

  it("has nobody for no header, a header that is not JSON, or not an object", () => {
    expect(readGatewayUser(null)).toBeUndefined();
    expect(readGatewayUser("{")).toBeUndefined();
    expect(readGatewayUser("3")).toBeUndefined();
  });
});
