import type { PixelIcon } from "../types";

// Car seen from the side, facing right: a cabin at the back, a windscreen sloping down to the bonnet, two wheels.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "car-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...####",
    "..#....#",
    ".#......###",
    ".#........#",
    ".#........#",
    ".##########",
    "..##....##",
    "..##....##",
  ],
};

export default icon;
