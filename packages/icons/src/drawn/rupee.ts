import type { PixelIcon } from "../types";

// Indian rupee sign: two bars, the bowl and the leg.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rupee",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".......#",
    ".......#",
    "..########",
    ".......#",
    "...####",
    "....#",
    ".....#",
    "......#",
    ".......#",
  ],
};

export default icon;
