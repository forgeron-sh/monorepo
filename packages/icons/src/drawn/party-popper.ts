import type { PixelIcon } from "../types";

// Party popper: a cone pointing down-left, confetti bursting from its mouth in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "party-popper",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......oo..o",
    "..o.......o",
    "",
    "....#...oo",
    "....##",
    "...#..#..o",
    "...#...#..o",
    "..#....##",
    "..#..##",
    ".#.##",
    ".##",
  ],
};

export default icon;
