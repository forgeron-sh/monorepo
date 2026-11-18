import type { PixelIcon } from "../types";

// Chevron pointing left: the right chevron mirrored, one tone.
const icon: PixelIcon = {
  name: "arrow-left-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".......##",
    "......##",
    ".....##",
    "....##",
    "....##",
    ".....##",
    "......##",
    ".......##",
  ],
};

export default icon;
