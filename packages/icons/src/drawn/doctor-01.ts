import type { PixelIcon } from "../types";

// Doctor: a person with a medical cross in the secondary tone on the chest.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "doctor-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "....#..#",
    ".....##",
    "",
    "...######",
    "..#......#",
    ".#...oo...#",
    ".#..oooo..#",
    ".#...oo...#",
    ".##########",
  ],
};

export default icon;
