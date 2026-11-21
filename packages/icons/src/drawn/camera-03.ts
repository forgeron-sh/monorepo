import type { PixelIcon } from "../types";

// Camera with a solid square lens in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "camera-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    ".##########",
    ".#........#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
