import type { PixelIcon } from "../types";

// Fried egg: an irregular white with a round yolk in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "egg-fried",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....####",
    "..###....#",
    ".#........#",
    ".#...oo....#",
    "#...oooo...#",
    "#...oooo..#",
    ".#...oo...#",
    ".#.......#",
    "..#.....#",
    "...#####",
  ],
};

export default icon;
