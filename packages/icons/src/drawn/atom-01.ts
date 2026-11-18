import type { PixelIcon } from "../types";

// Atom: two crossed orbits around a nucleus in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "atom-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##....##",
    ".#..#..#..#",
    ".#...##...#",
    "..#......#",
    "...#.oo.#",
    "...#.oo.#",
    "..#......#",
    ".#...##...#",
    ".#..#..#..#",
    "..##....##",
  ],
};

export default icon;
