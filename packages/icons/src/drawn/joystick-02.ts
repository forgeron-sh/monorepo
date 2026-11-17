import type { PixelIcon } from "../types";

// Arcade stick: a ball-top lever and two buttons on a wide panel.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "joystick-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..###",
    ".#...#",
    ".#...#",
    "..###",
    "...#..oo.oo",
    ".##########",
    ".#........#",
    ".##########",
  ],
};

export default icon;
