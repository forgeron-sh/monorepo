import type { PixelIcon } from "../types";

// Three boxes stacked, one on two, each with a strip of tape in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "boxes",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...######",
    "...#.oo.#",
    "...#....#",
    "...#....#",
    ".##########",
    ".#.o.##.o.#",
    ".#...##...#",
    ".#...##...#",
    ".##########",
  ],
};

export default icon;
