import type { PixelIcon } from "../types";

// Touchpad of `touchpad-01` with a ring-shaped touch point in the secondary tone on a taller pad and a one-row button strip.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "touchpad-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#...oo...#",
    ".#........#",
    ".##########",
    ".#........#",
    ".##########",
  ],
};

export default icon;
