import type { PixelIcon } from "../types";

// Empty battery: the body and tip of `battery-full`, no charge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "battery-empty",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#########",
    ".#.......#",
    ".#.......##",
    ".#.......##",
    ".#.......#",
    ".#########",
  ],
};

export default icon;
