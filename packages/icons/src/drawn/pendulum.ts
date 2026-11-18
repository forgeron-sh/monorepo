import type { PixelIcon } from "../types";

// A pendulum swinging from its bar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pendulum",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".....#",
    ".....#",
    "......#",
    "......#",
    ".......#",
    "......oooo",
    ".....o....o",
    ".....o....o",
    "......oooo",
  ],
};

export default icon;
