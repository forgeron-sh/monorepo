import type { PixelIcon } from "../types";

// Iris scan: the corner brackets of `face-id` around an eye, the iris in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "iris-scan",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    ".#........#",
    ".#........#",
    "...######",
    "..#..oo..#",
    "..#..oo..#",
    "...######",
    ".#........#",
    ".#........#",
    ".###....###",
  ],
};

export default icon;
