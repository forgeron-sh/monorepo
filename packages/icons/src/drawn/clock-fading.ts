import type { PixelIcon } from "../types";

// Clock of `clock-01` whose left half fades into dashes.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "clock-fading",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#..###",
    "..#......#",
    ".....o....#",
    ".....o....#",
    ".#...o....#",
    ".#...oooo.#",
    "..........#",
    "..........#",
    "..#......#",
    "...#..###",
  ],
};

export default icon;
