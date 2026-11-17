import type { PixelIcon } from "../types";

// Brick wall of `brick-wall` with a flame badge in the secondary tone: a firewall.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "brick-wall-fire",
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
    ".#####...o",
    ".#...#..oo",
    ".#...#..ooo",
    ".#####.ooooo",
    "........ooo",
  ],
};

export default icon;
