import type { PixelIcon } from "../types";

// Medal on crossed ribbons, a 1 on the disc.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "medal-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..oo....oo",
    "...oo..oo",
    "....oooo",
    "...######",
    "..#......#",
    "..#..##..#",
    "..#...#..#",
    "..#...#..#",
    "..#..###.#",
    "..#......#",
    "...######",
  ],
};

export default icon;
