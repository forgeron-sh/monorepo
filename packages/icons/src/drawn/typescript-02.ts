import type { PixelIcon } from "../types";

// A document with a cut corner and the letters TS inside, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "typescript-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "########",
    "#.......#",
    "#........#",
    "#.........#",
    "#.........#",
    "#.ooo..oo.#",
    "#..o..o...#",
    "#..o...o..#",
    "#..o....o.#",
    "#..o..oo..#",
    "#.........#",
    "###########",
  ],
};

export default icon;
