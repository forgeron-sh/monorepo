import type { PixelIcon } from "../types";

// Serving cloche: a domed cover with a knob, resting on a plate.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dish-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".....##",
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
    ".#........#",
    "############",
  ],
};

export default icon;
