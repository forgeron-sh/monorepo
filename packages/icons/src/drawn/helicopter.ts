import type { PixelIcon } from "../types";

// Helicopter seen from the side: rotor, mast, a round cabin, the tail boom, two skids.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "helicopter",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".....##",
    "...######",
    "..#....####",
    "..#....#..#",
    "..#....#",
    "...#####",
    "....#..#",
    "..########",
  ],
};

export default icon;
