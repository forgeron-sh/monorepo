import type { PixelIcon } from "../types";

// Cricket bat: a flat blade on the diagonal with a thin handle, the ball beside it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cricket-bat",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........#",
    ".........#",
    "........#",
    ".......###",
    "......###",
    ".....###",
    "....###",
    "...###...oo",
    "..###....oo",
    "..##",
  ],
};

export default icon;
