import type { PixelIcon } from "../types";

// A tray with an arrow leaving through the top: transition to the top.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "transition-top",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    "....oooo",
    "...oooooo",
    ".....oo",
    ".....oo",
    ".###.oo.###",
    ".#...oo...#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
