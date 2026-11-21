import type { PixelIcon } from "../types";

// Padlock above three password dots.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "login-method",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...#....#",
    "..########",
    "..#......#",
    "..#......#",
    "..########",
    "",
    "..oo.oo.oo",
    "..oo.oo.oo",
  ],
};

export default icon;
