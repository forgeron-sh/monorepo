import { describe, expect, it } from "vitest";
import { getEntry, getIcon } from "./catalog";
import * as icons from "./index";
import { AbacusIcon, AnvilIcon, ForgeronIcon } from "./index";
import { hasDuotone, isImplemented, pixelRows, toSvg } from "./render";
import type { DrawnIcon } from "./types";

describe("stubs", () => {
  it("render nothing and say so", () => {
    expect(AbacusIcon).toEqual({ name: "abacus", implemented: false });
    expect(isImplemented(AbacusIcon)).toBe(false);
    expect(hasDuotone(AbacusIcon)).toBe(false);
    expect(toSvg(AbacusIcon)).toBeNull();
  });
});

describe("pixel icons", () => {
  it("pads rows to the grid", () => {
    const rows = pixelRows(AnvilIcon as Parameters<typeof pixelRows>[0]);
    expect(rows).toHaveLength(12);
    expect(rows.every((r) => r.length === 12)).toBe(true);
  });

  it("draw every pixel in the primary tone when monotone", () => {
    const svg = toSvg(AnvilIcon) ?? "";
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="24" height="24"/);
    expect(svg).toContain('viewBox="0 0 12 12"');
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(svg.match(/<path /g)).toHaveLength(1);
    expect(svg).toContain('fill="currentColor"');
    expect(svg).toContain('aria-hidden="true"');
  });

  it("draw the secondary pixels in the secondary tone when duotone", () => {
    const svg = toSvg(AnvilIcon, { variant: "duo" }) ?? "";
    expect(svg.match(/<path /g)).toHaveLength(2);
    expect(svg).toContain(
      'style="fill:var(--icon-secondary, currentColor);opacity:var(--icon-secondary-opacity, 0.4)"',
    );
    const custom =
      toSvg(AnvilIcon, { variant: "duo", color: "#111", secondaryColor: "#ff4f1f" }) ?? "";
    expect(custom).toContain('fill="#111"');
    expect(custom).toContain('style="fill:#ff4f1f;opacity:1"');
  });

  it("merge runs of pixels into one rectangle", () => {
    const svg = toSvg(ForgeronIcon) ?? "";
    expect(svg).toContain("M0 0h12v1h-12z");
    expect(hasDuotone(ForgeronIcon)).toBe(false);
  });
});

/** Icons drawn on a larger grid, and why: the Cloudflare mark is too wide to read on 12×12; the
 * GitHub mark loses its ears and tail on 12×12 (docs/icons.md, brand logos). */
// Brand marks drawn on 16 because their detail does not survive 12 (docs/icons.md, "Brand logos").
const WIDER_GRID: Record<string, number> = {
  airtable: 16,
  asana: 16,
  attio: 16,
  cloudflare: 16,
  confluence: 16,
  github: 16,
  intercom: 16,
  jira: 16,
  linear: 16,
  "notion-01": 16,
  salesforce: 16,
  zendesk: 16,
};

describe("the drawn set", () => {
  it("is pixel art only, on the 12-pixel grid of the lab (16 for a brand mark that needs it)", () => {
    const drawn = Object.values(icons).filter(
      (v): v is DrawnIcon =>
        typeof v === "object" && v !== null && "implemented" in v && v.implemented,
    );
    expect(drawn.length).toBeGreaterThan(0);
    for (const icon of drawn) {
      expect(icon.style).toBe("pixel");
      expect(icon.grid).toBe(WIDER_GRID[icon.name] ?? 12);
      expect(icon.rows.length).toBeLessThanOrEqual(icon.grid);
      for (const row of icon.rows) expect(row.length).toBeLessThanOrEqual(icon.grid);
      for (const row of icon.rows) expect(row).toMatch(/^[#o.]*$/);
    }
  });

  it("stores trimmed rows: no trailing `.`, no trailing empty row (`bun run trim` fixes them)", () => {
    const drawn = Object.values(icons).filter(
      (v): v is DrawnIcon =>
        typeof v === "object" && v !== null && "implemented" in v && v.implemented,
    );
    const stale = drawn
      .filter((icon) => icon.rows.some((row) => row.endsWith(".")) || icon.rows.at(-1) === "")
      .map((icon) => icon.name);
    expect(stale).toEqual([]);
  });

  it("folds the secondary pixels into the primary tone when monotone", () => {
    const mono = toSvg(AnvilIcon, { variant: "mono", secondaryOpacity: 0.5 }) ?? "";
    expect(mono.match(/<path /g)).toHaveLength(1);
    expect(mono).not.toContain("opacity");
  });
});

describe("accessibility", () => {
  it("names the icon when a title is given, escaped", () => {
    const svg = toSvg(AnvilIcon, { title: 'Forge "here" & <now>' }) ?? "";
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="Forge &quot;here&quot; &amp; &lt;now&gt;"');
    expect(svg).toContain("<title>Forge &quot;here&quot; &amp; &lt;now&gt;</title>");
    expect(svg).not.toContain("aria-hidden");
  });
});

describe("catalog", () => {
  it("finds an icon by name or alias", () => {
    expect(getIcon("anvil")).toBe(AnvilIcon);
    expect(getIcon("cli")?.name).toBe("command-line");
    expect(getEntry("first-bracket")?.name).toBe("1st-bracket");
    expect(getIcon("no-such-icon")).toBeUndefined();
  });
});
