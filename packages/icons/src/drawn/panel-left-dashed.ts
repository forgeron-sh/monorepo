import type { PixelIcon } from "../types";

// Square panel split on the left by a dashed line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "panel-left-dashed",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#..o.....#",
    ".#..o.....#",
    ".#........#",
    ".#..o.....#",
    ".#..o.....#",
    ".#........#",
    ".#..o.....#",
    ".#..o.....#",
    ".##########",
  ],
};

export default icon;
