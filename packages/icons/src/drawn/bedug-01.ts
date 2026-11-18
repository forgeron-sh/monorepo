import type { PixelIcon } from "../types";

// Bedug: a barrel drum lying on its stand, the near drumhead in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bedug-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..oo#######",
    ".o..o.....#",
    ".o..o.....#",
    ".o..o.....#",
    ".o..o.....#",
    "..oo#######",
    "...#.....#",
    "..#.......#",
    ".#.........#",
  ],
};

export default icon;
