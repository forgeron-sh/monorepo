import type { PixelIcon } from "../types";

// Pen with a Bluetooth sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pen-connect-bluetooth",
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
    "...#..#..o",
    "..#..#...oo",
    ".#..#..o.o.o",
    "#..#....ooo",
    "#.#....o.o.o",
    "##.......oo",
    ".........o",
  ],
};

export default icon;
