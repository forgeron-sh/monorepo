import type { PixelIcon } from "../types";

// Stop in a ring: the ring of `clock-01`, a square in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "stop-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
