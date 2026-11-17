import type { PixelIcon } from "../types";

// Car seen from the front, solid, with the windscreen and headlights cut out.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "car-02",
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
    ".#..####..#",
    ".##########",
    ".##########",
    ".##......##",
    ".##......##",
  ],
};

export default icon;
