import type { PixelIcon } from "../types";

// A slash: one diagonal stroke, drawn like the chevrons with two-pixel runs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "slash",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........##",
    "........##",
    ".......##",
    "......##",
    ".....##",
    "....##",
    "...##",
    "..##",
    ".##",
    "##",
  ],
};

export default icon;
