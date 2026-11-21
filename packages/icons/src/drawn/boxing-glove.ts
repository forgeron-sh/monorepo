import type { PixelIcon } from "../types";

// Boxing glove, solid: a big rounded mitt with the thumb set apart, the cuff in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "boxing-glove",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....######",
    "...########",
    "..##########",
    ".##.########",
    ".##.########",
    ".##.########",
    "..#.#######",
    "...#######",
    "...oooooo",
    "...oooooo",
  ],
};

export default icon;
