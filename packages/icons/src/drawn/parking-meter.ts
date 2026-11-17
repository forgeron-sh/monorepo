import type { PixelIcon } from "../types";

// Parking meter: a rounded head with a display window in the secondary tone and a coin slot, on a post.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "parking-meter",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    "..#.oooo.#",
    "..#.oooo.#",
    "..#......#",
    "..#..##..#",
    "...######",
    ".....##",
    ".....##",
    ".....##",
    "...######",
  ],
};

export default icon;
