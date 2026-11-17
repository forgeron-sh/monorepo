import type { PixelIcon } from "../types";

// Sink: a basin under a tap.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sink-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....###",
    ".....#..#",
    ".....#",
    ".....#",
    ".##########",
    ".#........#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
