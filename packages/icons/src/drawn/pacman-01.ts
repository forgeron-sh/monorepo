import type { PixelIcon } from "../types";

// Pac-Man: the round eater with its mouth open to the right and two pellets in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pacman-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#####",
    ".#######",
    "####.###",
    "######",
    "####...o..o",
    "######",
    "########",
    "#########",
    ".#######",
    "..#####",
  ],
};

export default icon;
