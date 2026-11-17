import type { PixelIcon } from "../types";

// Card: a magnetic band in the secondary tone and a short number line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "credit-card",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#........#",
    ".#oooooooo#",
    ".#oooooooo#",
    ".#........#",
    ".#.###....#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
