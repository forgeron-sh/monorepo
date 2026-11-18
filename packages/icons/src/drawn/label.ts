import type { PixelIcon } from "../types";

// Label: a tag with a square left end and a pointed right end.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "label",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#######",
    ".#......#",
    ".#.......#",
    ".#........#",
    ".#........#",
    ".#.......#",
    ".#......#",
    ".#######",
  ],
};

export default icon;
