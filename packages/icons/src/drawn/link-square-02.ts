import type { PixelIcon } from "../types";

// External link: a box open at its upper right and a 45° arrow leaving it, the arrow in the
// secondary tone (the head of arrow-up-right-01).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "link-square-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......oooo",
    ".........oo",
    ".####...o.o",
    ".#.....o..o",
    ".#....o",
    ".#...o",
    ".#......#",
    ".#......#",
    ".#......#",
    ".########",
  ],
};

export default icon;
