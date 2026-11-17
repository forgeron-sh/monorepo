import type { PixelIcon } from "../types";

// Round speech bubble with its tail on the lower left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..#......#",
    "..#.######",
    "..#.#",
    "..##",
  ],
};

export default icon;
