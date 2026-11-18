import type { PixelIcon } from "../types";

// Bitcoin target: a crosshair, one ring with four short ticks out to the edges, and the bitcoin B
// of `coins-bitcoin` in the secondary tone at its centre.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-target",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "...######",
    "..#......#",
    ".#...o....#",
    ".#..ooo...#",
    "##..o..o..##",
    "##..ooo...##",
    ".#..o..o..#",
    ".#..ooo...#",
    "..#......#",
    "...######",
    ".....##",
  ],
};

export default icon;
