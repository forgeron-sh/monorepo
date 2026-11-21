import type { PixelIcon } from "../types";

// A truck under an arrow pointing back: a return shipment. Truck of `truck`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "truck-return",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..o",
    ".oooooo",
    "..o",
    "",
    ".#######",
    ".#.....#",
    ".#.....###",
    ".#.....#..#",
    ".#.....#..#",
    ".##########",
    "..oo....oo",
    "..oo....oo",
  ],
};

export default icon;
