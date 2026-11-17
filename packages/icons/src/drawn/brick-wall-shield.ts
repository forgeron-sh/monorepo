import type { PixelIcon } from "../types";

// Brick wall of `brick-wall` with a shield badge in the secondary tone: a protected firewall.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "brick-wall-shield",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#...#....#",
    ".#...#....#",
    ".##########",
    ".#.#...#..#",
    ".#.#",
    ".#####.ooooo",
    ".#...#.o...o",
    ".#...#.o...o",
    ".#####..o.o",
    ".........o",
  ],
};

export default icon;
