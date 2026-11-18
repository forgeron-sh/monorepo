import type { PixelIcon } from "../types";

// The Picasa mark in pixels: a disc with a pentagon at its centre and five blades turning round
// it.
// 16×16: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "picasa",
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    "......####",
    "....########",
    "....########",
    "..##.######.##",
    ".###.#####.####",
    ".####.###.#####",
    "#####.#..#######",
    "######....######",
    "######.....#####",
    "######....#.####",
    ".###..###.##.##",
    ".#..#####.###.#",
    "..######.####",
    "...#####.####",
    "....###.####",
    "......#.##",
  ],
};

export default icon;
