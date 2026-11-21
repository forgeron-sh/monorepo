import type { PixelIcon } from "../types";

// Tally marks: four upright strokes crossed by a 45° fifth stroke in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tally-5",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..........o",
    ".#..#..#.o#",
    ".#..#..#o.#",
    ".#..#..o..#",
    ".#..#.o#..#",
    ".#..#o.#..#",
    ".#..o..#..#",
    ".#.o#..#..#",
    ".#o.#..#..#",
    ".o..#..#..#",
    "o#..#..#..#",
  ],
};

export default icon;
