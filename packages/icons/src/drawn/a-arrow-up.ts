import type { PixelIcon } from "../types";

// Increase font size: a capital A beside an up arrow in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "a-arrow-up",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..#......o",
    ".#.#....ooo",
    ".#.#...o.o.o",
    "#...#....o",
    "#...#....o",
    "#####....o",
    "#...#....o",
    "#...#....o",
    "#...#....o",
  ],
};

export default icon;
