// Applies the platform D1 migrations before a deployment (.github/workflows/deploy.yml).
// Reads CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and PLATFORM_D1_ID from the environment and
// reaches the database through the D1 REST API. Not run against a remote database yet: whether the
// REST batch is one transaction is to check on the first deployment (see FOR-23).
import { createCloudflareClient, createRestD1 } from "@forgeron/hosting";
import { migratePlatform } from "../src/index";

const need = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set.`);
  return value;
};

const client = createCloudflareClient({
  accountId: need("CLOUDFLARE_ACCOUNT_ID"),
  apiToken: need("CLOUDFLARE_API_TOKEN"),
});
const { applied } = await migratePlatform(createRestD1(client, need("PLATFORM_D1_ID")));
console.log(applied.length ? `Applied: ${applied.join(", ")}` : "The platform D1 is up to date.");
