import type { PixelIcon } from "../types";

// Rounded box with voice bars inside and the S I badge of super intelligence at the lower right, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "super-intelligence-voice",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "#..........#",
    "#....#.....#",
    "#..#.#.#...#",
    "#..#.#.#...#",
    "#....#",
    ".#####.ooo.o",
    ".......o...o",
    ".......ooo.o",
    ".........o.o",
    ".......ooo.o",
  ],
};

export default icon;
