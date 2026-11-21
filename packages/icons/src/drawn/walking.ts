import type { PixelIcon } from "../types";

// Walking person: a head in the secondary tone, arms and legs in stride.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "walking",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......oo",
    "......oo",
    "",
    ".....###",
    "....#.##.#",
    "...#..##..#",
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
  ],
};

export default icon;
