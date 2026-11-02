import { defineConfig } from "@forgeron/sdk";

export default defineConfig({
  name: "declared-ok",
  resources: { secrets: { API_KEY: { why: "Key" } }, cache: {} },
  uses: { crm: "^1.0.0" },
});
