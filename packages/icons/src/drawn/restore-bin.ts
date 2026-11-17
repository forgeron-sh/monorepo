import type { PixelIcon } from "../types";

// The `delete-01` bin with an arrow rising out of it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "restore-bin",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    ".##########",
    "",
    "..#......#",
    "..#..oo..#",
    "..#.oooo.#",
    "..#..oo..#",
    "..#..oo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
