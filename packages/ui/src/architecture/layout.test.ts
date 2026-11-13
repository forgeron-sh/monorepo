import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup as html } from "react-dom/server";
import { ArchitectureDiagram } from "./ArchitectureDiagram";
import { crm, dashboard, inventory, odooGateway } from "./fixtures";
import { layoutArchitecture, type DiagramLayout } from "./layout";

const templates = { crm, dashboard, inventory, "odoo-gateway": odooGateway };
const ids = (layout: DiagramLayout, prefix: string) =>
  layout.nodes.filter((n) => n.id.startsWith(prefix)).map((n) => n.id);

describe("layoutArchitecture", () => {
  for (const [name, manifest] of Object.entries(templates)) {
    describe(`template ${name}`, () => {
      const layout = layoutArchitecture(manifest);

      it("is deterministic", () => {
        expect(layoutArchitecture(structuredClone(manifest))).toEqual(layout);
      });

      it("has the four interfaces, a group per action group, and every action once", () => {
        expect(ids(layout, "interface:")).toEqual([
          "interface:mcp",
          "interface:api",
          "interface:cli",
          "interface:web",
        ]);
        const groups = new Set(Object.keys(manifest.actions).map((a) => a.split(".")[0]));
        expect(ids(layout, "group:")).toHaveLength(groups.size);
        const rows = layout.nodes.flatMap((n) => n.rows ?? []);
        expect(rows).toHaveLength(Object.keys(manifest.actions).length);
        for (const [action, def] of Object.entries(manifest.actions)) {
          const text = layout.nodes.map((n) => n.text).join("\n");
          expect(text).toContain(`${action}, ${def.access} access`);
        }
      });

      it("keeps every node inside the box and nodes apart", () => {
        for (const n of layout.nodes) {
          expect(n.x).toBeGreaterThanOrEqual(0);
          expect(n.y).toBeGreaterThanOrEqual(0);
          expect(n.x + n.width).toBeLessThanOrEqual(layout.width);
          expect(n.y + n.height).toBeLessThanOrEqual(layout.height);
          expect(n.text.length).toBeGreaterThan(0);
        }
        for (const a of layout.nodes) {
          for (const b of layout.nodes) {
            if (a.id >= b.id) continue;
            const apart =
              a.x + a.width <= b.x ||
              b.x + b.width <= a.x ||
              a.y + a.height <= b.y ||
              b.y + b.height <= a.y;
            expect(apart, `${a.id} overlaps ${b.id}`).toBe(true);
          }
        }
      });

      it("draws an edge only from an offered interface to a group it exposes", () => {
        for (const edge of layout.edges) {
          const iface = edge.from.replace("interface:", "") as "mcp" | "api" | "cli" | "web";
          expect(manifest.interfaces[iface]).toBe(true);
          const group = edge.to.replace("group:", "");
          const exposed = Object.entries(manifest.actions).some(
            ([action, def]) => action.split(".")[0] === group && def.interfaces.includes(iface),
          );
          expect(exposed).toBe(true);
        }
        expect(layout.edges.every((e) => e.to.startsWith("group:"))).toBe(true);
      });

      it("describes every section from nodes that exist", () => {
        const known = new Set(layout.nodes.map((n) => n.id));
        for (const section of layout.sections) {
          expect(section.nodes.length).toBeGreaterThan(0);
          for (const id of section.nodes) expect(known.has(id)).toBe(true);
        }
      });
    });
  }

  it("crm: profiles, an event handler, a database and the interfaces' edges", () => {
    const layout = layoutArchitecture(crm);
    expect(ids(layout, "profile:")).toEqual([
      "profile:management",
      "profile:sales",
      "profile:support",
    ]);
    expect(ids(layout, "event:")).toEqual(["event:deal-history"]);
    expect(layout.nodes.find((n) => n.id === "event:deal-history")?.subtitle).toBe(
      "on deal.moved · sync",
    );
    expect(ids(layout, "resource:")).toEqual(["resource:db"]);
    expect(layout.edges).toHaveLength(4 * ids(layout, "group:").length);
  });

  it("dashboard: an interface that is off has no edge, a used tool is shown", () => {
    const layout = layoutArchitecture(dashboard);
    const api = layout.nodes.find((n) => n.id === "interface:api")!;
    expect(api.off).toBe(true);
    expect(api.subtitle).toBe("off");
    expect(layout.edges.some((e) => e.from === "interface:api")).toBe(false);
    expect(ids(layout, "tool:")).toEqual(["tool:crm"]);
    expect(layout.nodes.find((n) => n.id === "tool:crm")?.subtitle).toBe("^0.0.0");
  });

  it("inventory: scheduled task, files, a secret and an outbound host; a custom level is kept", () => {
    const layout = layoutArchitecture(inventory);
    expect(ids(layout, "task:")).toEqual(["task:sync-sharepoint"]);
    expect(ids(layout, "resource:")).toEqual(["resource:db", "resource:files"]);
    expect(ids(layout, "secret:")).toEqual(["secret:SHAREPOINT_TOKEN"]);
    expect(ids(layout, "host:")).toEqual(["host:graph.microsoft.com"]);
    const equipments = layout.nodes.find((n) => n.id === "group:equipments")!;
    expect(equipments.rows?.map((r) => r.access)).toContain("import");
  });

  it("odoo-gateway: personal secrets and wildcard hosts, no database", () => {
    const layout = layoutArchitecture(odooGateway);
    expect(ids(layout, "user-secret:")).toEqual([
      "user-secret:ODOO_API_KEY",
      "user-secret:ODOO_LOGIN",
    ]);
    expect(ids(layout, "host:")).toEqual(["host:*.odoo.com", "host:odoo.acme.fr"]);
    expect(ids(layout, "resource:")).toEqual(["resource:cache"]);
  });

  it("orders the sections the way they are read", () => {
    expect(layoutArchitecture(inventory).sections.map((s) => s.id)).toEqual([
      "interfaces",
      "actions",
      "resources",
      "profiles",
      "events",
      "tasks",
    ]);
  });

  it("shows connectors with their mode", () => {
    const layout = layoutArchitecture({
      ...crm,
      resources: {
        connectors: {
          microsoft: {
            type: "microsoft-365",
            mode: "delegated",
            scopes: ["Mail.Send"],
            why: "Mail",
          },
        },
      },
    });
    const node = layout.nodes.find((n) => n.id === "connector:microsoft")!;
    expect(node.text).toContain("delegated mode");
    expect(node.subtitle).toContain("On behalf of the person");
  });

  it("copes with a tool that has nothing: the four interfaces only", () => {
    const layout = layoutArchitecture({
      ...crm,
      actions: {},
      profiles: {},
      events: {},
      jobs: {},
      uses: {},
      resources: {},
    });
    expect(layout.nodes).toHaveLength(4);
    expect(layout.edges).toEqual([]);
    expect(layout.sections.map((s) => s.id)).toEqual(["interfaces"]);
  });

  it("puts an action without a group in an Ungrouped group, and cuts long names", () => {
    const action = crm.actions["deals.move"]!;
    const layout = layoutArchitecture({
      ...crm,
      actions: { ping: action, [`${"x".repeat(60)}.${"y".repeat(60)}`]: action },
    });
    const ungrouped = layout.nodes.find((n) => n.id === "group:_")!;
    expect(ungrouped.title).toBe("Ungrouped");
    expect(layout.nodes.find((n) => n.id.startsWith("group:xxx"))!.title.endsWith("…")).toBe(true);
    expect(layout.nodes.find((n) => n.id.startsWith("group:xxx"))!.text).toContain("x".repeat(60));
  });
});

describe("ArchitectureDiagram", () => {
  for (const [name, manifest] of Object.entries(templates)) {
    it(`${name}: every node is focusable and has a text alternative, the list repeats them`, () => {
      const out = html(h(ArchitectureDiagram, { manifest }));
      const layout = layoutArchitecture(manifest);
      expect(out.match(/tabindex="0"/g)).toHaveLength(layout.nodes.length);
      for (const node of layout.nodes) {
        const escaped = node.text
          .replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#x27;");
        expect(out).toContain(`aria-label="${escaped}"`);
        expect(out).toContain(`<li>${escaped}</li>`);
      }
      expect(out).toContain('viewBox="-1 -1 842');
      expect(out).toContain('aria-expanded="false"');
    });
  }

  it("uses design tokens only: no colour literal in the markup", () => {
    const out = html(h(ArchitectureDiagram, { manifest: crm }));
    expect(out).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(out).not.toContain("style=");
  });
});
