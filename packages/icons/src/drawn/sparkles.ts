import type { PixelIcon } from "../types";

// Sparkles: a large four-point star and a small one in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sparkles",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........o",
    "........ooo",
    "....##...o",
    "....##",
    "...####",
    ".########",
    ".########",
    "...####",
    "....##",
    "....##",
  ],
};

export default icon;
