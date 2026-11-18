import type { PixelIcon } from "../types";

// Key fob: a remote with a button, its blade below and a signal arc in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "key-generator-fob",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".######.o",
    ".#....#..o",
    ".#.##.#..o",
    ".#....#.o",
    ".######",
    "...##",
    "...###",
    "...##",
    "...###",
    "...##",
  ],
};

export default icon;
