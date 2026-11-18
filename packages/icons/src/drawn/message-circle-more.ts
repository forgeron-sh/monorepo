import type { PixelIcon } from "../types";

// Round speech bubble with three dots inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-circle-more",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
    ".#.o.o.o..#",
    ".#........#",
    ".#........#",
    "..#......#",
    "..#.######",
    "..#.#",
    "..##",
  ],
};

export default icon;
