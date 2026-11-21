import type { PixelIcon } from "../types";

// Arrow pointing down with a solid triangular head on a two-pixel shaft.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-down-05",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    ".##########",
    "..########",
    "...######",
    "....####",
    ".....##",
  ],
};

export default icon;
