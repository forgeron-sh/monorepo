import type { PixelIcon } from "../types";

// A kettlebell: a round body under a looped handle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "equipment-gym-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...#....#",
    "..########",
    ".#........#",
    "#..........#",
    "#..........#",
    "#..........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
