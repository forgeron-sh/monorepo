import type { PixelIcon } from "../types";

// Line right then up, arrowhead pointing up: `corner-left-up` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "corner-right-up",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........#",
    ".......###",
    "......#.#.#",
    "........#",
    "........#",
    "........#",
    "........#",
    "........#",
    ".......#",
    ".######",
  ],
};

export default icon;
