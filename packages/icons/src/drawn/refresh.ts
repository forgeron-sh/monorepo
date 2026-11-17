import type { PixelIcon } from "../types";

// Two arcs of the `clock-01` ring chasing each other, each ending in a small head; the drawing
// is symmetric by a half turn, so it is centred exactly.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "refresh",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".........###",
    "..........#",
    ".#",
    "###",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
