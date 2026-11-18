import type { PixelIcon } from "../types";

// Building: a tall block and a lower annex, the windows in the secondary tone, on a ground line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "building2",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".######",
    ".#....#",
    ".#.oo.#",
    ".#....#####",
    ".#.oo.#...#",
    ".#....#.o.#",
    ".#.oo.#...#",
    ".#....#.o.#",
    ".#....#...#",
    ".##########",
  ],
};

export default icon;
