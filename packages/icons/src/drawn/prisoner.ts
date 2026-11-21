import type { PixelIcon } from "../types";

// Person in a striped uniform.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "prisoner",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...#....#",
    "...#....#",
    "....####",
    "",
    "...######",
    "..oooooooo",
    ".#........#",
    ".oooooooooo",
  ],
};

export default icon;
