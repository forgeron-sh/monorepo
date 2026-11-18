import type { PixelIcon } from "../types";

// Pen with a USB plug in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pen-connect-usb",
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
    "..#..#.ooo",
    ".#..#..o.o",
    "#..#..ooooo",
    "#.#....ooo",
    "##......o",
  ],
};

export default icon;
