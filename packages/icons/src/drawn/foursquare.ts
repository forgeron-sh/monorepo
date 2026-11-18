import type { PixelIcon } from "../types";

// The Foursquare mark of 2014: a letter F cut out of a shield whose right edge slants to a point at
// the bottom.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "foursquare",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..#######",
    "..########",
    "..##.....#",
    "..##.#####",
    "..##....##",
    "..##.####",
    "..##.###",
    "..##.##",
    "..##.#",
    "..###",
    "..##",
    "..#",
  ],
};

export default icon;
