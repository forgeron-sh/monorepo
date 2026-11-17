import type { PixelIcon } from "../types";

// A person inside the corner brackets of a scan, the brackets in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-id-verification",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "ooo......ooo",
    "o..........o",
    "o....##....o",
    "....#..#",
    "....#..#",
    ".....##",
    "",
    "....####",
    "...#....#",
    "o..#....#..o",
    "o..........o",
    "ooo......ooo",
  ],
};

export default icon;
