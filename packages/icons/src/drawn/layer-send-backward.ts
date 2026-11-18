import type { PixelIcon } from "../types";

// Two overlapping squares, the highlighted one behind.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "layer-send-backward",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".######",
    ".#....#",
    ".#....#",
    ".#....#",
    ".#....#oooo",
    ".######...o",
    ".....o....o",
    ".....o....o",
    ".....o....o",
    ".....oooooo",
  ],
};

export default icon;
