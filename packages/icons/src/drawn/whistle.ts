import type { PixelIcon } from "../types";

// Whistle seen from the side: a round chamber and the mouthpiece reaching right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "whistle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..#########",
    ".#........#",
    "#.....#####",
    "#.....#",
    "#.....#",
    ".#...#",
    "..###",
  ],
};

export default icon;
