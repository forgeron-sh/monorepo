import type { PixelIcon } from "../types";

// Captions: a rounded frame with two lines of subtitle text in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "captions",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    "#..........#",
    "#..........#",
    "#.ooo.oooo.#",
    "#..........#",
    "#.oooo.ooo.#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
