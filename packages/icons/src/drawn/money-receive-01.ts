import type { PixelIcon } from "../types";

// Banknote with an arrow coming down into it, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "money-receive-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....oo",
    "..o..oo..o",
    "...o.oo.o",
    "....oooo",
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
