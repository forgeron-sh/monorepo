import type { PixelIcon } from "../types";

// Two arrows side by side, left over right: `arrow-up-down` turned, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-left-right",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#",
    "..#",
    ".##########",
    "..#",
    "...#",
    "........#",
    ".........#",
    ".##########",
    ".........#",
    "........#",
  ],
};

export default icon;
