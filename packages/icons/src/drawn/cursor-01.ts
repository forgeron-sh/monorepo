import type { PixelIcon } from "../types";

// Mouse pointer: a solid arrow and a two-pixel tail that steps down and right over four rows,
// clear of the head (redrawn on 2026-11-17: the tail was two rows long and looked squashed).
// Set one column right of the geometric centre, its weight being on the left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#",
    "...##",
    "...###",
    "...####",
    "...#####",
    "...######",
    "...####",
    "...##.##",
    "...#..##",
    ".......##",
    ".......##",
  ],
};

export default icon;
