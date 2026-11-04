import {
  consentCallbackRoute,
  listConsentsRoute,
  startConsentRoute,
  withdrawConsentRoute,
} from "@forgeron/platform-contract";
import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import { handleConsent } from "../consent/consent";
import type { PlatformEnv } from "./app";

// A person's consent for a delegated connector (docs/sdk.md section 10, D-076). The routes are in the
// contract and in the document, and `handleConsent` still answers them: a start is a `302` to the
// provider, the callback and the errors a person who follows the redirect sees are HTML pages, and a
// client gets the JSON. Every method reaches it, which answers `405` for the ones a path does not take.
// Without a way to seal tokens (`SECRETS_KEY`) there is no consent: a 404, as before.

const serve = async (c: Context<PlatformEnv>) => {
  if (!c.env.consent) return c.notFound();
  return (
    (await handleConsent(c.req.raw, {
      registry: c.env.registry,
      consent: await c.env.consent(),
      workspace: c.env.workspace,
      caller: async () => c.env.identity(),
    })) ?? c.notFound()
  );
};

export function mountConsent(app: OpenAPIHono<PlatformEnv>): void {
  const paths = new Set<string>();
  for (const route of [
    startConsentRoute,
    consentCallbackRoute,
    listConsentsRoute,
    withdrawConsentRoute,
  ]) {
    app.openAPIRegistry.registerPath(route);
    paths.add(route.path.replaceAll(/\{(\w+)\}/g, ":$1"));
  }
  for (const path of paths) app.all(path, serve);
}
