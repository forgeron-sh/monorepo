import type { Manifest } from "@forgeron/manifest";
import { describe, expect, it } from "vitest";
import { handleSecretsInput } from "./secrets";

// The setup page's connections and its link to the person's own secrets (D-111). Test values only.

const base: Manifest = {
  name: "hr",
  version: "1.0.0",
  interfaces: { mcp: true, api: true, cli: true, web: true },
  profiles: {},
  actions: {},
  views: {},
  jobs: {},
  events: {},
  resources: {},
  uses: {},
  preview: { data: "seed" },
};
const withKey: Manifest = {
  ...base,
  resources: {
    userSecrets: { ODOO_API_KEY: { label: "Odoo API key", why: "Read your tickets" } },
  },
};
const store: Parameters<typeof handleSecretsInput>[3] = {
  read: async () => ({}),
  write: async () => {},
};
const user = { id: "p1", email: "p@acme.test", name: "P", subjects: [] };
const get = (manifest: Manifest, extras: Parameters<typeof handleSecretsInput>[6]) =>
  handleSecretsInput(
    new Request("https://acme.forgeron.app/t/hr/secrets"),
    manifest,
    user,
    store,
    "https://acme.forgeron.app/t/hr",
    ({ body }) => new Response(body, { headers: { "content-type": "text/html" } }),
    extras,
  ).then((r) => r.text());

describe("the setup page", () => {
  it("shows each connection as connected or with a link to connect, escaped", async () => {
    const html = await get(withKey, {
      connectors: [
        {
          label: "microsoft",
          why: "Read your mail <b>",
          connected: true,
          url: "https://acme.forgeron.app/consent/a",
        },
        {
          label: "google",
          why: "Read your calendar",
          connected: false,
          url: "https://acme.forgeron.app/consent/b?x=1&y=2",
        },
      ],
    });
    expect(html).toContain("<h2>Connections</h2>");
    expect(html).toMatch(/microsoft<\/strong> <span class="tag-set">Connected<\/span>/);
    expect(html).toContain('href="https://acme.forgeron.app/consent/b?x=1&amp;y=2"');
    expect(html).not.toContain('consent/a"');
    expect(html).toContain("Read your mail &lt;b&gt;");
    // The form is still there.
    expect(html).toContain("Odoo API key");
  });

  it("shows the connections of a tool that asks for no secret, not 'asks for nothing'", async () => {
    const html = await get(base, {
      connectors: [{ label: "google", why: "Read", connected: false, url: "https://x.test/c" }],
    });
    expect(html).toContain("Connect");
    expect(html).not.toContain("asks for nothing");
  });

  it("links to the person's own secrets only when the host gives the address", async () => {
    expect(await get(withKey, { mySecrets: "/my/secrets" })).toContain('href="/my/secrets"');
    expect(await get(withKey, {})).not.toContain("/my/secrets");
  });

  it("still says nothing is asked when there is nothing to ask and nothing to connect", async () => {
    expect(await get(base, {})).toContain("This tool asks for nothing from you.");
  });
});
