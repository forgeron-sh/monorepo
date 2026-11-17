import type { PixelIcon } from "../types";

// Less-than sign: two 2:1 strokes meeting at a point on the left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "less-than",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "........##",
    "......##",
    "....##",
    "..##",
    "..##",
    "....##",
    "......##",
    "........##",
  ],
};

export default icon;
