import type { PixelIcon } from "../types";

// The Kimi logo mark in pixels: a K with a square dot at its upper right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "kimi-ai",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..........##",
    "..........##",
    "##....##",
    "##...##",
    "##..##",
    "##.##",
    "#####",
    "##.##",
    "##..##",
    "##...##",
    "##....##",
  ],
};

export default icon;
