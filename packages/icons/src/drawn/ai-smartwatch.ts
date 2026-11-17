import type { PixelIcon } from "../types";

// AI smartwatch: the face and straps of a watch, a sparkle on the screen in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ai-smartwatch",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...#####",
    "...#####",
    "...#####",
    "..#.....#",
    "..#..o..#",
    "..#.ooo.##",
    "..#..o..#",
    "..#.....#",
    "...#####",
    "...#####",
    "...#####",
  ],
};

export default icon;
