import type { PixelIcon } from "../types";

// Closed book with a thick spine in the secondary tone and a title on its cover.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "book-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..oo######",
    "..oo#....#",
    "..oo#.##.#",
    "..oo#....#",
    "..oo#....#",
    "..oo#....#",
    "..oo#....#",
    "..oo#....#",
    "..oo#....#",
    "..oo######",
  ],
};

export default icon;
