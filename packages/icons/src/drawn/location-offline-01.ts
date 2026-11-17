import type { PixelIcon } from "../types";

// Location pin struck through: location unavailable.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "location-offline-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o",
    ".o.######",
    "..o......#",
    ".#.o......#",
    ".#..o.....#",
    ".#...o....#",
    ".#....o...#",
    "..#....o.#",
    "...#....o",
    "....#..#.o",
    ".....##...o",
    "...........o",
  ],
};

export default icon;
