import type { PixelIcon } from "../types";

// Joystick: a ball on a stick over a base, the button in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "joystick-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....###",
    "...#...#",
    "...#...#",
    "....###",
    ".....#",
    ".....#.oo",
    ".#########",
    ".#.......#",
    ".#########",
  ],
};

export default icon;
