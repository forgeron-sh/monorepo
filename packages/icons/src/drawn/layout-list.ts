import type { PixelIcon } from "../types";

// List layout: a window with two rows, each a bullet in the secondary tone and a line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "layout-list",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#........#",
    ".#.o.####.#",
    ".#........#",
    ".#........#",
    ".#.o.####.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
