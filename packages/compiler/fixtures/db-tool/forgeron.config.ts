import { database, defineConfig } from "@forgeron/sdk";

export default defineConfig({
  name: "pipeline",
  roles: { sales: { grants: ["read", "write"] } },
  resources: { db: database({ why: "Companies and deals" }) },
});
