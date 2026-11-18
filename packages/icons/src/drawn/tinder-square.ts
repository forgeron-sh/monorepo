import type { PixelIcon } from "../types";

// The Tinder flame in a full-grid rounded square, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "tinder-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "#..........#",
    "#.....o....#",
    "#.....oo...#",
    "#...o.ooo..#",
    "#..oooooo..#",
    "#..oooooo..#",
    "#..oooooo..#",
    "#..oooooo..#",
    "#...oooo...#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
