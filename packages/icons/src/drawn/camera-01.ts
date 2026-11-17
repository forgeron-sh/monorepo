import type { PixelIcon } from "../types";

// Camera: a body with a top bump and a square lens ring.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the lens.
const icon: PixelIcon = {
  name: "camera-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    ".##########",
    ".#........#",
    ".#..oooo..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..oooo..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
