import type { PixelIcon } from "../types";

// Hiking: the walking person of `walking` with a trekking pole in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hiking",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......oo",
    "......oo",
    "...........o",
    ".....###...o",
    "....#.##.#.o",
    "...#..##..#o",
    ".....##....o",
    "....#..#...o",
    "...#....#..o",
    "..#......#.o",
  ],
};

export default icon;
