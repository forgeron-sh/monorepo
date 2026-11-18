import type { PixelIcon } from "../types";

// Smartphone with a home button, crossed by a diagonal slash in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "phone-off-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o..######",
    ".o.#....#",
    "..o.....#",
    "...o....#",
    "....o...#",
    "...#.o..#",
    "...#..o.#",
    "...#...o",
    "...#....o",
    "...#.##..o",
    "...#....#.o",
    "...######..o",
  ],
};

export default icon;
