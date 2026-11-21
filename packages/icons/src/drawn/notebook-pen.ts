import type { PixelIcon } from "../types";

// Notebook with rings and a cover label, a pencil badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "notebook-pen",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...########",
    "...#......#",
    ".###......#",
    "...#.####.#",
    "...#",
    "...#.....oo",
    "...#....o.o",
    ".###...o.o",
    "...#..o.o",
    "...##.oo",
  ],
};

export default icon;
