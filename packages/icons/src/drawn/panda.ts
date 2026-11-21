import type { PixelIcon } from "../types";

// Panda head with round ears, eye patches and a nose.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "panda",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "###......###",
    "###.####.###",
    "##.#....#.##",
    ".#........#",
    ".#.##..##.#",
    "#..##..##..#",
    "#..........#",
    "#....##....#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
