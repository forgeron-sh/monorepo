import { database, defineConfig } from "@forgeron/sdk";

export default defineConfig({
  name: "pipeline",
  profiles: { sales: { grants: ["read", "write"] } },
  resources: { db: database({ why: "Companies and deals" }) },
});
