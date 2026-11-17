import type { PixelIcon } from "../types";

// Heart, one-pixel outline: the drawing of `heart`, as Hugeicons draws both names alike.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "favourite",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..###..###",
    ".#...##...#",
    ".#........#",
    ".#........#",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
