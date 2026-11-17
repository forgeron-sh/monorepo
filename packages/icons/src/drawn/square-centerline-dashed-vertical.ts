import type { PixelIcon } from "../types";

// A dashed vertical centre line in the secondary tone down the frame of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-centerline-dashed-vertical",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#...o....#",
    ".#........#",
    ".#........#",
    ".#...o....#",
    ".#...o....#",
    ".#........#",
    ".#........#",
    ".#...o....#",
    "..########",
  ],
};

export default icon;
