import type { PixelIcon } from "../types";

// Kitchen knife on the diagonal: a solid blade tapering to a tip at top right, a gap, a handle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "knife-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........#",
    ".........##",
    "........###",
    ".......###",
    "......###",
    ".....###",
    "",
    "...##",
    "..##",
    ".##",
  ],
};

export default icon;
