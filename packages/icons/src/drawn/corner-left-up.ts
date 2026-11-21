import type { PixelIcon } from "../types";

// Line left then up, arrowhead pointing up: `arrow-turn-backward` turned a quarter.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "corner-left-up",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#",
    "..###",
    ".#.#.#",
    "...#",
    "...#",
    "...#",
    "...#",
    "...#",
    "....#",
    ".....######",
  ],
};

export default icon;
