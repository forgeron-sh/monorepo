import type { PixelIcon } from "../types";

// The Prophet's Mosque: the layout of `mosque-03` with its dome in the secondary tone, the green dome.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "the-prophets-mosque",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    ".#...##...#",
    ".#..oooo..#",
    "###o....o###",
    ".#o......o#",
    ".#o......o#",
    ".##########",
    ".#........#",
    ".#........#",
    ".#...##...#",
    ".#..#..#..#",
    ".####..####",
  ],
};

export default icon;
