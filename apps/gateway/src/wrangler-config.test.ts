import { GATEWAY_COMPATIBILITY_DATE, GATEWAY_COMPATIBILITY_FLAGS } from "@forgeron/hosting";
import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";

// `wrangler.jsonc` (for `wrangler dev`) repeats the settings that `@forgeron/hosting` names once:
// this fails when the two drift apart.
it("wrangler.jsonc carries the gateway compatibility settings", async () => {
  const text = await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8");
  expect(text).toContain(`"compatibility_date": "${GATEWAY_COMPATIBILITY_DATE}"`);
  expect(text).toContain(`"compatibility_flags": ${JSON.stringify(GATEWAY_COMPATIBILITY_FLAGS)}`);
});
