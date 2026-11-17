import type { PixelIcon } from "../types";

// Infinity: two loops crossing on a 2×2 centre, symmetric.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "infinity-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..##....##",
    ".#..#..#..#",
    "#....##....#",
    "#....##....#",
    ".#..#..#..#",
    "..##....##",
  ],
};

export default icon;
