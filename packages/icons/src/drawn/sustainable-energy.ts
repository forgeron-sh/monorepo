import type { PixelIcon } from "../types";

// Sustainable energy: two arrows turning in a circle around a lightning bolt in the secondary tone; the arrows of refresh.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sustainable-energy",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#....oo..#",
    ".....oo..###",
    "....oooo..#",
    ".#...oo",
    "###.oo",
    ".#..o.....#",
    "..#......#",
    "...######",
  ],
};

export default icon;
