import type { PixelIcon } from "../types";

// Box aligned middle left: the frame of `square`, a small block at its middle left in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "align-box-middle-left",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#.oo.....#",
    ".#.oo.....#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
