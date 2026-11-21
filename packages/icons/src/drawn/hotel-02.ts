import type { PixelIcon } from "../types";

// A hotel building: an H sign (secondary tone) above the door.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hotel-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    "..#.o..o.#",
    "..#.oooo.#",
    "..#.o..o.#",
    "..#......#",
    "..#......#",
    "..#.####.#",
    "..#.#..#.#",
    "..#.#..#.#",
    ".##########",
  ],
};

export default icon;
