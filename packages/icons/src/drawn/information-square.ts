import type { PixelIcon } from "../types";

// Letter i in the box of `checkmark-square-01`: the i of `information-circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "information-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...oo...#",
    ".#........#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
