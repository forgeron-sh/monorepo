import type { PixelIcon } from "../types";

// USB plug and cable struck through by a diagonal in the secondary tone: not connected.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "usb-not-connected-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o.########",
    ".o#.#..#.#",
    "..o......#",
    ".##o#######",
    ".#..o.....#",
    ".#...o....#",
    ".#....o...#",
    "..#....o.#",
    "...#####o",
    ".....##..o",
    ".....##...o",
    ".....##....o",
  ],
};

export default icon;
