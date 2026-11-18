import type { PixelIcon } from "../types";

// Pulley: a wheel hung from a beam, its axle in the secondary tone, a rope down both sides and a weight on one end.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pulley",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..########",
    ".....##",
    "....####",
    "...#....#",
    "..#..oo..#",
    "..#..oo..#",
    "..##....##",
    "..#.####.#",
    "..#......#",
    "..#.....###",
    "..#.....#.#",
    "..#.....###",
  ],
};

export default icon;
