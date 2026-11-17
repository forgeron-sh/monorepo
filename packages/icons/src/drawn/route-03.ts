import type { PixelIcon } from "../types";

// Route: a start node, a path turning twice, a flag in the secondary tone at the destination.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "route-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......#ooo",
    ".......#ooo",
    ".......#",
    ".......#",
    "..######",
    "..#",
    "..#",
    ".###",
    ".#.#",
    ".###",
  ],
};

export default icon;
