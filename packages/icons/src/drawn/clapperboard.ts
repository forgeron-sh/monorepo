import type { PixelIcon } from "../types";

// Clapperboard: a board under a hinged bar with slanted stripes.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "clapperboard",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#.##..##.#",
    ".###..##..#",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
