import type { PixelIcon } from "../types";

// The Klarna mark in pixels: an upright bar, a curved stroke and the full stop.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "klarna",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "##....##",
    "##....##",
    "##...##",
    "##..###",
    "##.###",
    "#####",
    "##.###",
    "##..###",
    "##...###.##",
    "##....##.##",
  ],
};

export default icon;
