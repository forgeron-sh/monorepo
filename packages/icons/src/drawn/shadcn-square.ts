import type { PixelIcon } from "../types";

// The shadcn/ui mark in a rounded square: the two parallel slashes cut out of the square.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "shadcn-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "############",
    "#########.##",
    "########.###",
    "#######.####",
    "######.#####",
    "#####.###.##",
    "####.###.###",
    "###.###.####",
    "##.###.#####",
    "############",
    ".##########",
  ],
};

export default icon;
