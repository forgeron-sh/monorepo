import type { PixelIcon } from "../types";

// Crosshair: a ring crossed by four short ticks that stop before the centre.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "crosshair",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....###",
    "..##.#.##",
    ".#...#...#",
    ".#...#...#",
    "#.........#",
    "####...####",
    "#.........#",
    ".#...#...#",
    ".#...#...#",
    "..##.#.##",
    "....###",
  ],
};

export default icon;
