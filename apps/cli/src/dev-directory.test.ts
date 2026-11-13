import type { Manifest } from "@forgeron/manifest";
import { describe, expect, it } from "vitest";
import { developer, type DevDirectoryFile } from "./dev-directory";

const manifest = {
  profiles: { user: { grants: ["read"], default: true }, manager: { grants: ["read", "write"] } },
  actions: { "notes.add": { access: "write" } },
  views: {},
  resources: { directory: { why: "x", teams: true } },
} as unknown as Manifest;

const file: DevDirectoryFile = {
  members: [{ email: "dev@localhost" }, { email: "mia@acme.fr", name: "Mia" }],
  teams: [{ id: "sales", name: "Sales", members: ["mia@acme.fr"] }],
};

describe("developer (D-136)", () => {
  it("is in the admin team without --user, with the default grants", () => {
    expect(developer(file, manifest, {})).toMatchObject({
      id: "dev",
      subjects: ["everyone", "team:admin"],
      teams: ["admin"],
    });
    expect(developer(file, manifest, {}).permissions).toBeUndefined();
  });

  it("takes the teams of the directory for --user, and --team over them", () => {
    expect(developer(file, manifest, { user: "mia@acme.fr" }).subjects).toEqual([
      "everyone",
      "team:sales",
    ]);
    expect(
      developer(file, manifest, { user: "mia@acme.fr", teams: ["ops", "admin"] }).subjects,
    ).toEqual(["everyone", "team:admin", "team:ops"]);
  });

  it("gives exactly a profile's permissions with --as, every permission with --as all", () => {
    expect(developer(file, manifest, { as: "manager" }).permissions).toEqual({
      everyone: ["read", "write"],
    });
    expect(developer(file, manifest, { as: "all" }).permissions).toEqual({
      everyone: ["read", "write"],
    });
    // `--as` is not the admin team: the person is only who the directory says.
    expect(developer(file, manifest, { as: "user" }).subjects).toEqual(["everyone"]);
  });

  it("refuses a person who is not in the directory", () => {
    expect(() => developer(file, manifest, { user: "x@y.z" })).toThrow("not in the directory");
  });
});
