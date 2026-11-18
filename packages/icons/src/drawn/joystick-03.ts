import type { PixelIcon } from "../types";

// Joystick with its lever tilted to the left over the base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "joystick-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..###",
    ".#...#",
    ".#...#",
    "..###",
    "....#",
    ".....#..oo",
    ".##########",
    ".#........#",
    ".##########",
  ],
};

export default icon;
