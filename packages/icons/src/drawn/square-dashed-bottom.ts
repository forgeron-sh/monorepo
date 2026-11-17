import type { PixelIcon } from "../types";

// A square whose bottom edge is dashed: `square` above, the corners of `square-dashed` below.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-dashed-bottom",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    "",
    ".#........#",
    ".##..##..##",
  ],
};

export default icon;
