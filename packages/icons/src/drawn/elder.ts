import type { PixelIcon } from "../types";

// Elderly person: a figure leaning on a walking cane in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "elder",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....##",
    "....##",
    "",
    "...####",
    "..#.##.#",
    "..#.##..oo",
    "....##...o",
    "...#..#..o",
    "...#..#..o",
    "..#....#.o",
    "..#....#.o",
  ],
};

export default icon;
