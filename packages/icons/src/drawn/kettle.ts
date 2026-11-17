import type { PixelIcon } from "../types";

// Kettle: a body with a lid and knob, the spout on the left and the handle on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "kettle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "...######",
    "#.#......###",
    ".##......#.#",
    "..#......#.#",
    "..#......###",
    "..#......#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
