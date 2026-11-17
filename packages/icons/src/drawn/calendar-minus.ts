import type { PixelIcon } from "../types";

// Calendar with a minus inside (calendar-remove-01 has a badge).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-minus",
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
    ".#........#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
