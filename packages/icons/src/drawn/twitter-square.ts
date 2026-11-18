import type { PixelIcon } from "../types";

// The Twitter bird in a full-grid rounded square, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "twitter-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "#..........#",
    "#..........#",
    "#.....ooo..#",
    "#.o..ooooo.#",
    "#.oo.oooo..#",
    "#.ooooooo..#",
    "#..oooooo..#",
    "#...oooo...#",
    "#.ooooo....#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
