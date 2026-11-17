import type { PixelIcon } from "../types";

// Kick scooter: handlebar, stem, deck and two wheels.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "scooter-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......####",
    "........#",
    "........#",
    "........#",
    "........#",
    "........#",
    "........#",
    "..#######",
    ".##.....##",
    ".##.....##",
  ],
};

export default icon;
