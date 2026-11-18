import type { PixelIcon } from "../types";

// Round speech bubble drawn as a dashed outline.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-circle-dashed",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##..##",
    "..#......#",
    ".#........#",
    ".#........#",
    "",
    ".#........#",
    "",
    "..#......#",
    "..#...####",
    "..#.#",
    "..##",
  ],
};

export default icon;
