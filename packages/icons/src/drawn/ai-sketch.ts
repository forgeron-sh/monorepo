import type { PixelIcon } from "../types";

// AI sketch: a pencil at 45°, point down to the left, the AI sparkle badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ai-sketch",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........##",
    "........#.#",
    ".......#.#",
    "......#.#",
    ".....#.#",
    "....#.#",
    "...#.#...o",
    "..#.#...ooo",
    "..##...ooooo",
    ".#......ooo",
    ".........o",
  ],
};

export default icon;
