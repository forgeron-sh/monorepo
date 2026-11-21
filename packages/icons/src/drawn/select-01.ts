import type { PixelIcon } from "../types";

// Selection: a dashed square, two-pixel dashes and gaps, solid corners.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "select-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##..##..##",
    ".#........#",
    "",
    "",
    ".#........#",
    ".#........#",
    "",
    "",
    ".#........#",
    ".##..##..##",
  ],
};

export default icon;
