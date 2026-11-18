import type { PixelIcon } from "../types";

// A pie chart with its lower-right slice taken out and a bitcoin sign in its place.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-pie-chart",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
    ".#...######",
    ".#...#",
    ".#...#.oooo",
    ".#...#.o...o",
    "..#..#.oooo",
    "...###.o...o",
    ".......oooo",
  ],
};

export default icon;
