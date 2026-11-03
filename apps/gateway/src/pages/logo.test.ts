import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOGO_PATHS, LOGO_VIEWBOX } from "./logo";

// The inline logo of the page shell is the logo of assets/logos, not a redraw.
describe("the shell's logo", () => {
  it("is the horizontal logo of the assets", () => {
    const svg = readFileSync(
      new URL("../../../../assets/logos/4-transparent/forgeron-logo-white.svg", import.meta.url),
      "utf8",
    );
    expect(/<g fill="#FFFFFF">(.*?)<\/g>/s.exec(svg)?.[1]).toBe(LOGO_PATHS);
    expect(/viewBox="([^"]+)"/.exec(svg)?.[1]).toBe(LOGO_VIEWBOX);
  });
});
