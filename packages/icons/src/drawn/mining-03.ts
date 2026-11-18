import type { PixelIcon } from "../types";

// Mining rig: a graphics board with a round fan after `gpu`, and the bitcoin badge of `file-bitcoin` in its corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "mining-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "############",
    "#...##.....#",
    "#..#..#....#",
    "#..#..#....#",
    "#...##",
    "#......oooo",
    "#......o...o",
    "######.oooo",
    "..####.o...o",
    ".......oooo",
  ],
};

export default icon;
