import type { PixelIcon } from "../types";

// Curvy up and down: one S-shaped line with an arrowhead up at one end and down at the other, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "curvy-up-down-direction",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#",
    "..###",
    ".#.#.#",
    "...#",
    "....#",
    ".....#",
    "......#",
    ".......#",
    ".....#.#.#",
    "......###",
    ".......#",
  ],
};

export default icon;
