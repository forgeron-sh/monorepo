import type { PixelIcon } from "../types";

// Calendar with four day marks.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-days",
  implemented: true,
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
    ".#.##..##.#",
    ".#........#",
    ".#.##..##.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
