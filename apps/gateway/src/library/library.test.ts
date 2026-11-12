import type { Availability } from "@forgeron/registry";
import { describe, expect, it } from "vitest";
import { pilotAccess } from "./library";

// Who reaches a channel other than production (D-125, D-129): an admin always; a developer on a
// branch's temporary channel; a permanent channel in draft (`nobody`, or no rule) is for admins only,
// and once published, its people reach it after adding it, a developer like anyone.

const people = {
  admin: { id: "a", email: "a@acme.test", name: "a", roles: ["admin", "member"] },
  developer: { id: "d", email: "d@acme.test", name: "d", roles: ["developer", "member"] },
  member: { id: "m", email: "m@acme.test", name: "m", roles: ["member"] },
};

const registry = (rule: Availability | undefined, installed: string[] = []) => ({
  channelAccessOf: async () => rule,
  isChannelInstalled: async (_tool: string, _ref: string, person: string) =>
    installed.includes(person),
});
const rule = (mode: Availability["mode"], roles: string[] = []): Availability => ({
  mode,
  roles,
  people: [],
});

describe("pilotAccess (D-129)", () => {
  it("keeps a branch's temporary channel open to admins and developers", async () => {
    for (const who of [people.admin, people.developer]) {
      expect(await pilotAccess(registry(undefined), "t", "feat-x", who)).toBe(true);
    }
    expect(await pilotAccess(registry(undefined), "t", "feat-x", people.member)).toBe(false);
  });

  it("keeps a permanent channel in draft for admins alone", async () => {
    for (const draft of [undefined, rule("nobody")]) {
      expect(await pilotAccess(registry(draft), "t", "~staging", people.admin)).toBe(true);
      expect(await pilotAccess(registry(draft, ["d"]), "t", "~staging", people.developer)).toBe(
        false,
      );
      expect(await pilotAccess(registry(draft, ["m"]), "t", "~staging", people.member)).toBe(false);
    }
  });

  it("lets the people it is published to in, once they added it", async () => {
    const toDevelopers = rule("roles", ["developer"]);
    expect(await pilotAccess(registry(toDevelopers), "t", "~staging", people.developer)).toBe(
      false,
    );
    expect(
      await pilotAccess(registry(toDevelopers, ["d"]), "t", "~staging", people.developer),
    ).toBe(true);
    expect(await pilotAccess(registry(toDevelopers, ["m"]), "t", "~staging", people.member)).toBe(
      false,
    );
    // Everyone holds member (D-128): published to everyone is every person of the workspace.
    expect(
      await pilotAccess(registry(rule("everyone"), ["m"]), "t", "~staging", people.member),
    ).toBe(true);
  });
});
