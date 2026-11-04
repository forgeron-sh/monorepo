// SPIKE FOR-144: modules own their migration lists; the composition root merges them by name.
// The merged list must equal the installed one (names and fingerprints) or a real D1 refuses to start.
import type { BuildMigration } from "@forgeron/hosting";
import { describe, expect, it } from "vitest";
import { platformMigrations } from "./migrations";

interface Module {
  name: string;
  migrations: BuildMigration[];
}

const OWNER: Record<string, string> = {
  "0001_registry": "catalog", // tools, builds, versions, environments, approvals: five tables, one file
  "0002_deployments": "catalog",
  "0003_secrets": "secrets",
  "0004_connections": "connections",
  "0005_audit_log": "audit",
  "0006_role_access": "access",
  "0007_seats": "seats",
  "0008_members": "members",
  "0009_cli_codes": "identity",
  "0010_gateway_code": "gateway-assets",
  "0011_group_members": "members",
  "0012_token_revocations": "identity",
  "0013_user_secrets": "secrets",
  "0014_audit_access": "audit",
  "0015_identity_config": "identity",
  "0016_email_sign_in": "identity", // also creates invitations and membership_settings (members)
  "0017_saml": "identity",
  "0018_gateway_assets": "gateway-assets",
  "0019_remove_pilot": "catalog", // rebuilds secrets, connections, deployments, drops group_members
};

const byModule = (): Module[] => {
  const groups = new Map<string, BuildMigration[]>();
  for (const m of platformMigrations) {
    const owner = OWNER[m.name];
    if (!owner) throw new Error(`no owner for ${m.name}`);
    groups.set(owner, [...(groups.get(owner) ?? []), m]);
  }
  return [...groups].map(([name, migrations]) => ({ name, migrations }));
};

/** The composition root: every module's list, one global order by name, no duplicate. */
const compose = (modules: Module[]) => {
  const all = modules.flatMap((m) => m.migrations).sort((a, b) => a.name.localeCompare(b.name));
  const seen = new Set<string>();
  for (const m of all) {
    if (seen.has(m.name)) throw new Error(`duplicate migration ${m.name}`);
    seen.add(m.name);
  }
  return all;
};

describe("modules own migrations", () => {
  it("composes the same names, fingerprints and order as the installed platform D1", () => {
    const modules = byModule();
    expect(modules.length).toBe(9);
    const composed = compose(modules);
    expect(composed.map((m) => [m.name, m.fingerprint])).toEqual(
      platformMigrations.map((m) => [m.name, m.fingerprint]),
    );
    expect(composed).toEqual(platformMigrations);
  });

  it("is independent of the order the modules are registered in", () => {
    expect(compose(byModule().reverse())).toEqual(platformMigrations);
  });
});
