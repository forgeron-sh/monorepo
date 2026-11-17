import type { PixelIcon } from "../types";

// A square split into top and bottom halves by a bar in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-split-vertical",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    "",
    ".oooooooooo",
    ".oooooooooo",
    "",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
