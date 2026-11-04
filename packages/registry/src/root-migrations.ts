import type { BuildMigration } from "@forgeron/hosting";
import { st } from "./kernel/sql";

// The migrations of the stores that are not modules yet (gateway code and assets, identity config,
// SAML): they keep their global numbers and move into a module when they get one.
export const rootMigrations: BuildMigration[] = [
  {
    // The gateway's own `worker.js` (D-032): `forgeron platform install` stores it here so that the
    // running gateway can upload a new version of itself when a tool is bound. Chunks: a D1
    // statement is limited in size.
    name: "0010_gateway_code",
    fingerprint: "gateway-code-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "gateway_code" (
  "part" INTEGER PRIMARY KEY NOT NULL,
  "content" TEXT NOT NULL
)`),
    ],
    down: [st(`DROP TABLE "gateway_code"`)],
  },
  {
    // The workspace's sign-in provider and the OAuth clients of its delegated connectors (D-041).
    // Client secrets are sealed (iv + ciphertext), never stored in the clear.
    name: "0015_identity_config",
    fingerprint: "identity-config-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "identity_providers" (
  "workspace" TEXT NOT NULL PRIMARY KEY,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('oidc', 'entra', 'google')),
  "issuer" TEXT,
  "client_id" TEXT NOT NULL,
  "tenant" TEXT,
  "hosted_domain" TEXT,
  "email_claim" TEXT,
  "groups_claim" TEXT,
  "group_roles" TEXT NOT NULL,
  "iv" TEXT,
  "ciphertext" TEXT,
  "updated_by" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
)`),
      st(`CREATE TABLE "connector_clients" (
  "workspace" TEXT NOT NULL,
  "connector" TEXT NOT NULL,
  "authorize_url" TEXT NOT NULL,
  "token_url" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "iv" TEXT,
  "ciphertext" TEXT,
  "updated_by" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  PRIMARY KEY ("workspace", "connector")
)`),
    ],
    down: [st(`DROP TABLE "connector_clients"`), st(`DROP TABLE "identity_providers"`)],
  },
  {
    // SAML sign-in (D-050): a workspace's SAML provider (pinned certificates, attribute mapping) and
    // the short-lived ids that bind a response to its request and refuse a replayed assertion.
    name: "0017_saml",
    fingerprint: "saml-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "saml_providers" (
  "workspace" TEXT NOT NULL PRIMARY KEY,
  "idp_entity_id" TEXT NOT NULL,
  "sso_url" TEXT NOT NULL,
  "certificates" TEXT NOT NULL,
  "email_attribute" TEXT,
  "groups_attribute" TEXT,
  "name_attribute" TEXT,
  "group_roles" TEXT NOT NULL,
  "updated_by" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
)`),
      st(`CREATE TABLE "saml_requests" (
  "workspace" TEXT NOT NULL,
  "id" TEXT NOT NULL,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('request', 'assertion')),
  "expires_at" TEXT NOT NULL,
  PRIMARY KEY ("workspace", "id", "kind")
)`),
    ],
    down: [st(`DROP TABLE "saml_requests"`), st(`DROP TABLE "saml_providers"`)],
  },
  {
    // The console's files (D-052): `platform install` stores them so that the running gateway can
    // upload them again with each new version of itself (Cloudflare does not inherit assets). One row
    // per chunk of base64: a D1 statement is limited in size.
    name: "0018_gateway_assets",
    fingerprint: "gateway-assets-v1",
    destructive: false,
    up: [
      st(`CREATE TABLE "gateway_assets" (
  "path" TEXT NOT NULL,
  "part" INTEGER NOT NULL,
  "hash" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  PRIMARY KEY ("path", "part")
)`),
    ],
    down: [st(`DROP TABLE "gateway_assets"`)],
  },
];
