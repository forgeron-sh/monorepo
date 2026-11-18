import type { PixelIcon } from "../types";

// Tools: a screwdriver and a wrench crossed at 45°, the screwdriver handle in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tools",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........#.#",
    ".#......###",
    "..#....###",
    "...#..###",
    "....####",
    ".....##",
    "....####",
    "...###..o",
    "..###..ooo",
    ".###....ooo",
    ".#.......oo",
  ],
};

export default icon;
