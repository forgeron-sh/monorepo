import type { PixelIcon } from "../types";

// Flip phone: a handset with an antenna on the upper left and a small screen.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "flip-phone",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#",
    "...######",
    "...#....#",
    "...#.oo.#",
    "...#.oo.#",
    "...#....#",
    "...#....#",
    "...#.##.#",
    "...#....#",
    "...######",
  ],
};

export default icon;
