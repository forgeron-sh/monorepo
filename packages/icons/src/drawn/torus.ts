import type { PixelIcon } from "../types";

// A torus: a flat ring seen from above and in front.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "torus",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...######",
    ".##......##",
    "#...####...#",
    "#..#....#..#",
    "#...####...#",
    "#..........#",
    ".##......##",
    "...######",
  ],
};

export default icon;
