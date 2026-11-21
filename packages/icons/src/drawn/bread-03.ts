import type { PixelIcon } from "../types";

// Slice of bread: the domed crown of a sandwich loaf over a straight body, one-pixel outline, symmetric.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bread-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..########",
  ],
};

export default icon;
