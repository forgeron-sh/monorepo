import type { PixelIcon } from "../types";

// Cactus: a solid trunk with one arm on each side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cactus",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....####..##",
    "##..####..##",
    "##..####..##",
    "##..########",
    "########",
    "....####",
    "....####",
    "....####",
    "....####",
  ],
};

export default icon;
