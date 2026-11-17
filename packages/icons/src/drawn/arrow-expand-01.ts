import type { PixelIcon } from "../types";

// Expand: the upper right and lower left arrows of `maximize-01`, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-expand-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......####",
    ".........##",
    "........#.#",
    ".......#..#",
    "",
    "",
    ".#..#",
    ".#.#",
    ".##",
    ".####",
  ],
};

export default icon;
