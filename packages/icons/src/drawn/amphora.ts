import type { PixelIcon } from "../types";

// Amphora: a narrow neck, two loop handles, a body tapering to a foot.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "amphora",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "....#..#",
    ".##.#..#.##",
    ".#.#....#.#",
    ".##......##",
    "..#......#",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
    "....####",
  ],
};

export default icon;
