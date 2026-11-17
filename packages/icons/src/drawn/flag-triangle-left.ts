import type { PixelIcon } from "../types";

// Pennant pointing left on a pole at the right: `flag-02` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "flag-triangle-left",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........##",
    "......##.#",
    "....##...#",
    "..##.....#",
    "....##...#",
    "......##.#",
    "........##",
    ".........#",
    ".........#",
    ".........#",
  ],
};

export default icon;
