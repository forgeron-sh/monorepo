import type { PixelIcon } from "../types";

// Two gusts of wind with a down arrow in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wind-arrow-down",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....###",
    ".......#",
    "#######",
    ".........o",
    ".........o",
    "#####....o",
    ".....#...o",
    "..###..ooooo",
    "........ooo",
    ".........o",
  ],
};

export default icon;
