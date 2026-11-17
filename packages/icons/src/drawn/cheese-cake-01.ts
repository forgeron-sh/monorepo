import type { PixelIcon } from "../types";

// Cheesecake slice: the wedge of `cake-slice`, a cherry on top in the secondary tone, a crust band below.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cheese-cake-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......oo",
    ".......oo",
    "......####",
    "....##...#",
    "..##.....#",
    ".#########",
    ".#.......#",
    ".#########",
    ".#.......#",
    ".#########",
  ],
};

export default icon;
