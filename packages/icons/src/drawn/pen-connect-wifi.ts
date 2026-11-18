import type { PixelIcon } from "../types";

// Pen with a Wi-Fi signal in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pen-connect-wifi",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......##",
    "......#..#",
    ".....#..#",
    "....#..#",
    "...#..#",
    "..#..#.oooo",
    ".#..#.o....o",
    "#..#....oo",
    "#.#",
    "##......oo",
  ],
};

export default icon;
