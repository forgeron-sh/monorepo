import { database, defineConfig } from "@forgeron/sdk";

export default defineConfig({
  name: "dbping",
  roles: { reader: { grants: ["read"] } },
  resources: { db: database() },
});
