import type { PixelIcon } from "../types";

// Mentor: a person beside a board with lines of text, the lines in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mentor",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#######",
    ".##..#.....#",
    "#..#.#.ooo.#",
    "#..#.#.....#",
    ".##..#.oo..#",
    ".....#######",
    ".####",
    "#....#",
    "#....#",
    "#....#",
  ],
};

export default icon;
