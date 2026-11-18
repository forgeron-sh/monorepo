import type { PixelIcon } from "../types";

// Physics: an atom, two crossed orbits around a nucleus in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "physics",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....#..#",
    "....#..#",
    "..########",
    ".#..#..#..#",
    "#...#oo#...#",
    "#...#oo#...#",
    ".#..#..#..#",
    "..########",
    "....#..#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
