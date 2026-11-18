import type { PixelIcon } from "../types";

// A dashed square: the outline of a square in dashes, corners kept.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-dashed",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##..##..##",
    ".#........#",
    "",
    "",
    ".#........#",
    ".#........#",
    "",
    "",
    ".#........#",
    ".##..##..##",
  ],
};

export default icon;
