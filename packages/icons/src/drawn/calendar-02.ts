import type { PixelIcon } from "../types";

// Calendar page with two agenda lines in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#....#",
    ".##########",
    ".##########",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
