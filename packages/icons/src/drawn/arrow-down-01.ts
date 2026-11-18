import type { PixelIcon } from "../types";

// Chevron pointing down, 12×12: two-pixel diagonals, one tone (a tip in the secondary tone marked
// no idea and read as a stray pixel). One row lower than the centre: its weight is at the top.
const icon: PixelIcon = {
  name: "arrow-down-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    "..#......#",
    "..##....##",
    "...##..##",
    "....####",
    ".....##",
  ],
};

export default icon;
