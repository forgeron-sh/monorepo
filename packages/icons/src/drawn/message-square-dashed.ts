import type { PixelIcon } from "../types";

// Square speech bubble drawn with a dashed outline.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-square-dashed",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..###..###",
    ".#........#",
    ".#........#",
    "",
    ".#........#",
    ".#........#",
    "..#...####",
    "..#.#",
    "..##",
  ],
};

export default icon;
