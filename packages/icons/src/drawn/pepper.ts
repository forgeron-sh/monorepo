import type { PixelIcon } from "../types";

// A bell pepper with its stem in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pepper",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......oo",
    ".....oo",
    "..###oo###",
    ".#...##...#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..#......#",
    "..#..##..#",
    "...##..##",
  ],
};

export default icon;
