import type { PixelIcon } from "../types";

// Apricot: a round fruit with a dimple, its stem and a leaf in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "apricot",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".......oo",
    "......oo",
    ".....#",
    "..###.###",
    ".#...#...#",
    "#.........#",
    "#.........#",
    "#.........#",
    ".#.......#",
    "..##...##",
    "....###",
  ],
};

export default icon;
