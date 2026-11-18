import type { PixelIcon } from "../types";

// Forklift, side view: the mast and forks on the left, the cab guard and body, two wheels in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "forklift",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#..#####",
    "..#..#...#",
    "..#..#...#",
    "..#..#...#",
    "..#.########",
    "..#.#......#",
    "..#.#......#",
    "..#.########",
    "###..oo..oo",
    ".....oo..oo",
  ],
};

export default icon;
