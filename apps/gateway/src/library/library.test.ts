import type { Availability } from "@forgeron/registry";
import { describe, expect, it } from "vitest";
import type { PlatformPermission } from "@forgeron/permissions";
import { testPerson } from "../kernel/test-person";
import { pilotAccess } from "./library";

// Who reaches a channel other than production (D-125, D-129, D-137): who holds `tools:publish` always;
// who holds `tools:read` on a branch's temporary channel; a permanent channel in draft (`nobody`, or
// no rule) is for who publishes alone, and once published, its people reach it after adding it,
// whoever else they are.

const person = (id: string, teams: string[], permissions: PlatformPermission[]) => ({
  id,
  teams,
  permissions: testPerson(permissions).permissions,
});
const people = {
  publisher: person("p", ["admin"], ["tools:publish"]),
  reader: person("r", ["developer"], ["tools:read"]),
  member: person("m", [], []),
};

const registry = (rule: Availability | undefined, installed: string[] = []) => ({
  channelAccessOf: async () => rule,
  isChannelInstalled: async (_tool: string, _ref: string, person: string) =>
    installed.includes(person),
});
const rule = (mode: Availability["mode"], teams: string[] = []): Availability => ({
  mode,
  teams,
  people: [],
});

describe("pilotAccess (D-129)", () => {
  it("keeps a branch's temporary channel open to who holds `tools:read`", async () => {
    for (const who of [people.publisher, people.reader]) {
      expect(await pilotAccess(registry(undefined), "t", "feat-x", who)).toBe(true);
    }
    expect(await pilotAccess(registry(undefined), "t", "feat-x", people.member)).toBe(false);
  });

  it("keeps a permanent channel in draft for who holds `tools:publish` alone", async () => {
    for (const draft of [undefined, rule("nobody")]) {
      expect(await pilotAccess(registry(draft), "t", "~staging", people.publisher)).toBe(true);
      expect(await pilotAccess(registry(draft, ["r"]), "t", "~staging", people.reader)).toBe(false);
      expect(await pilotAccess(registry(draft, ["m"]), "t", "~staging", people.member)).toBe(false);
    }
  });

  it("lets the people it is published to in, once they added it", async () => {
    const toDevelopers = rule("teams", ["developer"]);
    expect(await pilotAccess(registry(toDevelopers), "t", "~staging", people.reader)).toBe(false);
    expect(await pilotAccess(registry(toDevelopers, ["r"]), "t", "~staging", people.reader)).toBe(
      true,
    );
    expect(await pilotAccess(registry(toDevelopers, ["m"]), "t", "~staging", people.member)).toBe(
      false,
    );
    // Published to everyone is every person of the workspace, in a team or not.
    expect(
      await pilotAccess(registry(rule("everyone"), ["m"]), "t", "~staging", people.member),
    ).toBe(true);
  });
});
