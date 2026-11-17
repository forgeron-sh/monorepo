import type { PixelIcon } from "../types";

// Game controller: a body with two grips, a cross pad, four buttons in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "game-controller-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    ".#........#",
    "#..#....o..#",
    "#.###..o.o.#",
    "#..#....o..#",
    "#..........#",
    "#...####...#",
    ".###....###",
  ],
};

export default icon;
