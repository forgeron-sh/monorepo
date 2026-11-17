import type { PixelIcon } from "../types";

// Calendar with a plus inside (calendar-add-01 has a badge).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-add-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#....#",
    ".##########",
    ".##########",
    ".#........#",
    ".#...oo...#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#...oo...#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
