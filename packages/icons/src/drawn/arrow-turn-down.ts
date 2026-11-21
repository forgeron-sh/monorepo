import type { PixelIcon } from "../types";

// An arrow coming from the right and turning down.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-turn-down",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....######",
    "....#",
    "...#",
    "...#",
    "...#",
    "...#",
    "...#",
    ".#.#.#",
    "..###",
    "...#",
  ],
};

export default icon;
