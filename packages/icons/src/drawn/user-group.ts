import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`team`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "user-group",
  implemented: true,
  style: "pixel",
  grid: 12,
  rows: [
    "",
    "..###",
    ".#####..ooo",
    ".#####.ooooo",
    "..###..ooooo",
    "........ooo",
    ".#####",
    "#######ooooo",
    "#######ooooo",
    "#######ooooo",
  ],
};

export default icon;
