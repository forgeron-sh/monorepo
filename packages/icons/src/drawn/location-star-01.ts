import type { PixelIcon } from "../types";

// Location pin with a star: a starred place.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "location-star-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..####",
    ".#....#",
    ".#.##.#",
    ".#.##.#",
    "..#..#",
    "...##...o",
    "......ooooo",
    ".......ooo",
    ".......ooo",
    "......o...o",
  ],
};

export default icon;
