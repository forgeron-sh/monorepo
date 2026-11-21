import type { PixelIcon } from "../types";

// Screen on a stand with four corners pointing inwards in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "minimize-screen",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#..o..o..#",
    ".#.oo..oo.#",
    ".#........#",
    ".#.oo..oo.#",
    ".#..o..o..#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
