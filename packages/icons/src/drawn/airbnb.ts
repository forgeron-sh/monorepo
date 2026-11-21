import type { PixelIcon } from "../types";

// The Airbnb Bélo in pixels: the outlined drop with its inner loop and the two lobes at its base.
// 12×12: `#` primary tone. Rasterised from `simple-icons:airbnb` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Airbnb and the Airbnb logo are trademarks of Airbnb, Inc., used here only to refer to Airbnb.
const icon: PixelIcon = {
  name: "airbnb",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....#..#",
    "...#....#",
    "...#....#",
    "..#..##..#",
    "..#.#..#.#",
    ".#..#..#..#",
    ".#...##...#",
    "#...#..#...#",
    "#..#....#..#",
    "#.#......#.#",
    ".#........#",
  ],
};

export default icon;
