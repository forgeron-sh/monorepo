import type { PixelIcon } from "../types";

// Banknote with an arrow leaving it upwards, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "money-send-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....oo",
    "....oooo",
    "...o.oo.o",
    "..o..oo..o",
    ".....oo",
    "",
    ".##########",
    ".#...##...#",
    ".#..#..#..#",
    ".#...##...#",
    ".##########",
  ],
};

export default icon;
