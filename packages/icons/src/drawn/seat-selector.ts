import type { PixelIcon } from "../types";

// Seat: an armchair seen from the front.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "seat-selector",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "...#....#",
    "...#....#",
    ".###....###",
    ".#.#....#.#",
    ".#.######.#",
    ".#........#",
    ".##########",
    "..#......#",
    "..#......#",
  ],
};

export default icon;
