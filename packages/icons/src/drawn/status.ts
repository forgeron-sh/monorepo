import type { PixelIcon } from "../types";

// A ring broken into four arcs, a status indicator.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "status",
  implemented: true,
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
    "",
    ".#........#",
    ".#........#",
    "..#......#",
    "...##..##",
  ],
};

export default icon;
