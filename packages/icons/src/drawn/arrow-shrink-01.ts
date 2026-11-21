import type { PixelIcon } from "../types";

// Shrink: the upper right and lower left arrows of `minimize-01`, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-shrink-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........#",
    ".......#.#",
    ".......##",
    ".......####",
    "",
    "",
    ".####",
    "...##",
    "..#.#",
    ".#",
  ],
};

export default icon;
