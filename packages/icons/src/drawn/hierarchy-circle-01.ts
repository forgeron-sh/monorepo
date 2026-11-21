import type { PixelIcon } from "../types";

// Hierarchy: a round node linked to two round nodes in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hierarchy-circle-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "....#..#",
    ".....##",
    ".....##",
    "..########",
    "..##....##",
    "..oo....oo",
    ".o..o..o..o",
    ".o..o..o..o",
    "..oo....oo",
  ],
};

export default icon;
