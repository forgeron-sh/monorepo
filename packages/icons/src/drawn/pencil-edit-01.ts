import type { PixelIcon } from "../types";

// Edit: a box open at its upper right, a solid 45° pencil writing into it, its eraser in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pencil-edit-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........o",
    ".........oo",
    ".#####..#o",
    ".#.....##",
    ".#....##",
    ".#...##",
    ".#..#...#",
    ".#..#...#",
    ".#......#",
    ".########",
  ],
};

export default icon;
