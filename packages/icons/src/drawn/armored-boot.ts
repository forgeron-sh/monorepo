import type { PixelIcon } from "../types";

// Armoured boot: a tall shaft and a foot, the plates marked by lines.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "armored-boot",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#####",
    "..#...#",
    "..#####",
    "..#...#",
    "..#...##",
    "..#.....#",
    "..#......#",
    "..#.......#",
    "..##########",
    "..#........#",
    "..##########",
  ],
};

export default icon;
