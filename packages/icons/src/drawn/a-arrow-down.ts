import type { PixelIcon } from "../types";

// Decrease font size: a capital A beside a down arrow in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "a-arrow-down",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..#......o",
    ".#.#.....o",
    ".#.#.....o",
    "#...#....o",
    "#...#....o",
    "#####....o",
    "#...#..o.o.o",
    "#...#...ooo",
    "#...#....o",
  ],
};

export default icon;
