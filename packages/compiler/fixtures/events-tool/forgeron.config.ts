import { defineConfig, queue } from "@forgeron/sdk";

export default defineConfig({
  name: "shop",
  interfaces: { mcp: true, api: true },
  roles: { staff: { grants: ["write"] } },
  resources: { queue: queue({ why: "Sending the confirmation after the order" }) },
});
