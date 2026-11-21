import type { PixelIcon } from "../types";

// Calendar with a date range in the secondary tone: two end marks joined by a bar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-range",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#....#",
    ".##########",
    ".#........#",
    ".##########",
    ".#........#",
    ".#.o....o.#",
    ".#.oooooo.#",
    ".#.o....o.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
