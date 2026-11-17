import type { PixelIcon } from "../types";

// Dim sun: the disc of `sun-01` with its four short straight rays, the diagonal rays shortened to one dot each in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sun-dim",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    "..o.....o",
    ".....##",
    ".##.####.##",
    ".##.####.##",
    ".....##",
    "..o.....o",
    ".....##",
    ".....##",
  ],
};

export default icon;
