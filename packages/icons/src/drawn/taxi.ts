import type { PixelIcon } from "../types";

// Taxi: `car-01` with a four-pixel sign on the roof in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "taxi",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....oooo",
    "...######",
    "..#......#",
    ".##########",
    ".###....###",
    ".#........#",
    ".##########",
    ".##......##",
    ".##......##",
  ],
};

export default icon;
