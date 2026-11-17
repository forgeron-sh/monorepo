import type { PixelIcon } from "../types";

// Full signal: a solid wedge rising to the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "signal-full-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........#",
    ".........##",
    "........###",
    ".......####",
    "......#####",
    ".....######",
    "....#######",
    "...########",
    "..#########",
    ".##########",
  ],
};

export default icon;
