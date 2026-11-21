import type { PixelIcon } from "../types";

// To-do list: a checked item in the secondary tone and an empty box, each with a line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "list-todo",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....o",
    ".o.o..#####",
    "..o",
    "",
    "",
    ".###",
    ".#.#..#####",
    ".###",
  ],
};

export default icon;
