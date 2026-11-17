import type { PixelIcon } from "../types";

// Tree with a three-lobed canopy on the trunk of `tree-01` in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tree-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "...#....#",
    ".###....###",
    "#..........#",
    "#..........#",
    "#..........#",
    ".##......##",
    "...##oo##",
    ".....oo",
    ".....oo",
    ".....oo",
  ],
};

export default icon;
