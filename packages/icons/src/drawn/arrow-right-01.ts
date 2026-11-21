import type { PixelIcon } from "../types";

// Chevron pointing right: the down chevron turned a quarter, one tone.
const icon: PixelIcon = {
  name: "arrow-right-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...##",
    "....##",
    ".....##",
    "......##",
    "......##",
    ".....##",
    "....##",
    "...##",
  ],
};

export default icon;
