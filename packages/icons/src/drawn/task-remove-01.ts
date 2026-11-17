import type { PixelIcon } from "../types";

// Task list with a cross, in the secondary tone, in place of the second task's line; the boxes of task-01.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "task-remove-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".###",
    ".#.#..#####",
    ".###",
    "",
    "......o...o",
    ".###...o.o",
    ".#.#....o",
    ".###...o.o",
    "......o...o",
  ],
};

export default icon;
