import type { PixelIcon } from "../types";

// Restaurant: a serving cloche with its knob, on a tray.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "restaurant-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....##",
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    "############",
  ],
};

export default icon;
