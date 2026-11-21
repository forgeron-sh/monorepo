import type { PixelIcon } from "../types";

// Switch off: `toggle-on` with the knob on the left, in the primary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "toggle-off",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..########",
    ".#.##.....#",
    "#.####.....#",
    "#.####.....#",
    ".#.##.....#",
    "..########",
  ],
};

export default icon;
