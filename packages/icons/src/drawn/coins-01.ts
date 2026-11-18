import type { PixelIcon } from "../types";

// Stack of coins seen from the side, the top coin's face in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "coins-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#oooooooo#",
    "..########",
    ".#........#",
    "..########",
    ".#........#",
    "..########",
    ".#........#",
    "..########",
  ],
};

export default icon;
