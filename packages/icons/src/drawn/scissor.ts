import type { PixelIcon } from "../types";

// Scissors: two blades crossing on a 2×2 pivot, the handles in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "scissor",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
    ".....##",
    "....#..#",
    "..oo....oo",
    ".o..o..o..o",
    ".o..o..o..o",
    "..oo....oo",
  ],
};

export default icon;
