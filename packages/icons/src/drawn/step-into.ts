import type { PixelIcon } from "../types";

// An arrow pointing down into a dot: debugger step into.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "step-into",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....#",
    ".....#",
    ".....#",
    ".....#",
    "...#.#.#",
    "....###",
    ".....#",
    "",
    "",
    "....###",
    "....###",
  ],
};

export default icon;
