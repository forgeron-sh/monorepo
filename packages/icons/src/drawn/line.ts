import type { PixelIcon } from "../types";

// Line tool: a 45° line between two square handles in the secondary tone, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "line",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........oo",
    ".........oo",
    "........#",
    ".......#",
    "......#",
    ".....#",
    "....#",
    "...#",
    ".oo",
    ".oo",
  ],
};

export default icon;
