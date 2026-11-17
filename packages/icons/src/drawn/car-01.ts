import type { PixelIcon } from "../types";

// Car seen from the front: roof, bonnet, the headlights in the secondary tone, two wheels.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "car-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...######",
    "..#......#",
    ".##########",
    ".#oo....oo#",
    ".#........#",
    ".##########",
    ".##......##",
    ".##......##",
  ],
};

export default icon;
