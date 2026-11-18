import type { PixelIcon } from "../types";

// Compass: the ring of `clock-01` and a needle, the north half in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "compass",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#......o.#",
    ".#.....o..#",
    ".#...oo...#",
    ".#...##...#",
    ".#..#.....#",
    ".#.#......#",
    "..#......#",
    "...######",
  ],
};

export default icon;
