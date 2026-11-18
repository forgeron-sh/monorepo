import type { PixelIcon } from "../types";

// Parking: a two-pixel P in the secondary tone in a square frame.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "parking-area-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#..oooo..#",
    ".#..oo.oo.#",
    ".#..oo.oo.#",
    ".#..oooo..#",
    ".#..oo....#",
    ".#..oo....#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
