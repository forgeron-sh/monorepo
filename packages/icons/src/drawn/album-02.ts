import type { PixelIcon } from "../types";

// Album: a picture in front of a second frame in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "album-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...oooooooo",
    "...o......o",
    ".########.o",
    ".#......#.o",
    ".#.##...#.o",
    ".#......#.o",
    ".#...#..#.o",
    ".#..###.#oo",
    ".#.######",
    ".########",
  ],
};

export default icon;
