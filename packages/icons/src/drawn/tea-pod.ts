import type { PixelIcon } from "../types";

// Teapot: a lid with a knob, a round body, a spout on the left and a handle on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tea-pod",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "...######",
    "..#......#",
    "#.#......###",
    "#.#......#.#",
    ".##......#.#",
    "..#......###",
    "..#......#",
    "...######",
  ],
};

export default icon;
