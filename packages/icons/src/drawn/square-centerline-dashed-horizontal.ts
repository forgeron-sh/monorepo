import type { PixelIcon } from "../types";

// Square with a dashed horizontal centre line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "square-centerline-dashed-horizontal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#o..oo..o#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
