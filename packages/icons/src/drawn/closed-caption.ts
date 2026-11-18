import type { PixelIcon } from "../types";

// Two letters C in the frame of `captions`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "closed-caption",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    "#..........#",
    "#..oo...oo.#",
    "#.o....o...#",
    "#.o....o...#",
    "#..oo...oo.#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
