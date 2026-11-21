import type { PixelIcon } from "../types";

// An oval coffee bean with its S-shaped crease.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "coffee-beans",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###",
    "##.##",
    "##.##",
    "##.##.###",
    "##.####.##",
    "##.####.##",
    ".###.##.##",
    ".....##.##",
    ".....##.##",
    "......###",
  ],
};

export default icon;
