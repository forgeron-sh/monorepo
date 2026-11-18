import type { PixelIcon } from "../types";

// Mortar bowl on a flat foot with a pestle resting in it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mortar",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........##",
    "........##",
    ".......#",
    "......#",
    ".##########",
    ".#........#",
    ".#........#",
    "..#......#",
    "...#....#",
    "..########",
  ],
};

export default icon;
