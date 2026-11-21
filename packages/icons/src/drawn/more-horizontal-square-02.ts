import type { PixelIcon } from "../types";

// Rounded square with three dots in a row, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "more-horizontal-square-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "#..........#",
    "#..........#",
    "#..........#",
    "#.oo.oo.oo.#",
    "#.oo.oo.oo.#",
    "#..........#",
    "#..........#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
