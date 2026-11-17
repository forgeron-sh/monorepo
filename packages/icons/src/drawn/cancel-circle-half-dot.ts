import type { PixelIcon } from "../types";

// Cancel, half done: the ring of `add-circle-half-dot`, the cross of `cancel-circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cancel-circle-half-dot",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##.####",
    ".........#",
    ".#........#",
    ".#..o..o..#",
    ".....oo...#",
    ".....oo...#",
    ".#..o..o..#",
    ".#........#",
    ".........#",
    "...##.####",
  ],
};

export default icon;
