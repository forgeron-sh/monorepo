import { database, defineConfig } from "@forgeron/sdk";

export default defineConfig({ name: "schema-ahead", resources: { db: database() } });
