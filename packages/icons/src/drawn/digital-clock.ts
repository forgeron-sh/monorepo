import type { PixelIcon } from "../types";

// A digital clock: a rounded display showing the digits 1 and 2.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "digital-clock",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "#..........#",
    "#..o...ooo.#",
    "#.oo.....o.#",
    "#..o...ooo.#",
    "#..o...o...#",
    "#..o...ooo.#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
