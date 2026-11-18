import type { PixelIcon } from "../types";

// The React mark in pixels: the atom, two tilted orbits and the level one crossing around the
// nucleus.
// 16×16: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "react",
  implemented: true,
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    "",
    "...####..####",
    "...#..#..#..#",
    "...#...##...#",
    "...#..#..#..#",
    "..####....####",
    ".#..#......#..#",
    "#...#..##..#...#",
    "#...#..##..#...#",
    ".#..#......#..#",
    "..####....####",
    "...#..#..#..#",
    "...#...##...#",
    "...#..#..#..#",
    "...####..####",
  ],
};

export default icon;
