import type { PixelIcon } from "../types";

// Input field (the input-text base) with a placeholder line and an add sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "custom-field",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    "#..........#",
    "#..........#",
    "#.......o..#",
    "#.###..ooo.#",
    "#.......o..#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
