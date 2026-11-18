import type { PixelIcon } from "../types";

// The WPS Office W in a full-grid rounded square, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "wps-office-rectangle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "#..........#",
    "#..........#",
    "#.........o#",
    "#.o...o..oo#",
    "#.o..ooo.o.#",
    "#..o.o.ooo.#",
    "#..oo...o..#",
    "#..........#",
    "#..........#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
