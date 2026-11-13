import { database, defineConfig } from "@forgeron/sdk";

export default defineConfig({
  name: "dbping",
  profiles: { reader: { grants: ["read"] } },
  resources: { db: database() },
});
