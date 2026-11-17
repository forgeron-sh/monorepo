import type { PixelIcon } from "../types";

// Boom box: a carrying handle over a wide case with two speakers in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "boom-box",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    "############",
    "#..........#",
    "#.ooo..ooo.#",
    "#.o.o..o.o.#",
    "#.ooo..ooo.#",
    "#..........#",
    "############",
  ],
};

export default icon;
