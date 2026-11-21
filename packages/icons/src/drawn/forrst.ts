import type { PixelIcon } from "../types";

// The Forrst mark: a small tree with spreading branches inside a triangle.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "forrst",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....#..#",
    "....#..#",
    "...#.##.#",
    "...#.##.#",
    "..#.####.#",
    "..#..##..#",
    ".#.######.#",
    ".#...##...#",
    "#....##....#",
    "############",
  ],
};

export default icon;
