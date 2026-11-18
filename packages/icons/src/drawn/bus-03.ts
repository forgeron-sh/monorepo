import type { PixelIcon } from "../types";

// Bus seen from the side: a long body with a band of windows in the secondary tone, two wheels.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bus-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#........#",
    ".#oooooooo#",
    ".#oooooooo#",
    ".#........#",
    ".##########",
    "..##....##",
    "..##....##",
  ],
};

export default icon;
