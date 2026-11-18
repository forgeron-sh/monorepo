import type { PixelIcon } from "../types";

// The yen sign: a V on a two-pixel stem crossed by two bars.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "yen",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##....##",
    "...##..##",
    "....####",
    ".....##",
    "...######",
    ".....##",
    "...######",
    ".....##",
    ".....##",
    ".....##",
  ],
};

export default icon;
