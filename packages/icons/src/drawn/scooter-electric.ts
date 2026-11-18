import type { PixelIcon } from "../types";

// Electric scooter: the scooter of `scooter-01` with a lightning bolt in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "scooter-electric",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...o...####",
    "..o.....#",
    ".oooo...#",
    "...o....#",
    "..o.....#",
    "........#",
    "........#",
    "..#######",
    ".##.....##",
    ".##.....##",
  ],
};

export default icon;
