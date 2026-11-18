import type { PixelIcon } from "../types";

// Cheque: a long slip with an amount line and the signature line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pay-by-check",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "############",
    "#..........#",
    "#.####.....#",
    "#..........#",
    "#.##..oooo.#",
    "#..........#",
    "############",
  ],
};

export default icon;
