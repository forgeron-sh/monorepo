import type { PixelIcon } from "../types";

// A tray with an arrow leaving through the bottom: transition to the bottom. `transition-top`, flipped.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "transition-bottom",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#...oo...#",
    ".###.oo.###",
    ".....oo",
    ".....oo",
    "...oooooo",
    "....oooo",
    ".....oo",
  ],
};

export default icon;
