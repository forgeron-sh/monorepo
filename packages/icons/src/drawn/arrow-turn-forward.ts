import type { PixelIcon } from "../types";

// `arrow-turn-backward` mirrored: rising on the left and turning right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-turn-forward",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........#",
    ".........#",
    "...########",
    "..#......#",
    ".#......#",
    ".#",
    ".#",
    ".#",
    ".#",
    ".#",
  ],
};

export default icon;
