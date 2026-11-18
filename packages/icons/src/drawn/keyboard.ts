import type { PixelIcon } from "../types";

// Keyboard: a frame, two rows of three keys (two keys a row read as a face), the space bar in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "keyboard",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "############",
    "#..........#",
    "#.##.##.##.#",
    "#..........#",
    "#.##.##.##.#",
    "#..........#",
    "#..oooooo..#",
    "############",
  ],
};

export default icon;
