import type { PixelIcon } from "../types";

// Round-bottom flask: a neck over a round bulb, the liquid in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "flask-round",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    "....#..#",
    "....#..#",
    "....#..#",
    "..##....##",
    ".#........#",
    "#..........#",
    "#oooooooooo#",
    "#oooooooooo#",
    ".#oooooooo#",
    "..##oooo##",
    "....####",
  ],
};

export default icon;
