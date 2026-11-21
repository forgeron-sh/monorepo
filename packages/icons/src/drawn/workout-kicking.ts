import type { PixelIcon } from "../types";

// Kick: a person on one leg kicking high to the side, the head in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "workout-kicking",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..oo",
    "..oo",
    "...........#",
    ".####.....#",
    "#.##.....#",
    "..##...##",
    "..######",
    "..#",
    "..#",
    "..#",
    ".##",
  ],
};

export default icon;
