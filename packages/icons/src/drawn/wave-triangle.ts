import type { PixelIcon } from "../types";

// Triangle wave: a signal rising and falling in straight 45° lines.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wave-triangle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    "...#.....#",
    "..#.#...#.#",
    ".#...#.#...#",
    "#.....#",
  ],
};

export default icon;
