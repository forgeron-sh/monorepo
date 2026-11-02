import { defineConfig } from "@forgeron/sdk";

export default defineConfig({
  name: "undeclared-secret",
  resources: { secrets: { OTHER_KEY: { why: "Another secret" } } },
});
