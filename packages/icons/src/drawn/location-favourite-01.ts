import type { PixelIcon } from "../types";

// Location pin with a heart: a favourite place.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "location-favourite-01",
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
    "...##",
    "......oo.oo",
    "......ooooo",
    ".......ooo",
    "........o",
  ],
};

export default icon;
