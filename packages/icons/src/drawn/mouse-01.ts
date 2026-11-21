import type { PixelIcon } from "../types";

// Mouse: a rounded body, the wheel in the secondary tone, the line between the buttons.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mouse-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#.oo.#",
    "...#.oo.#",
    "...#....#",
    "...######",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "....####",
  ],
};

export default icon;
