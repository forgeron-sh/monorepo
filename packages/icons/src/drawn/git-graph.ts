import type { PixelIcon } from "../types";

// Commit graph, in the style of the git icons: a trunk between two square nodes and a branch (secondary tone) leaving it at 45° to a third node.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "git-graph",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..###",
    "..#.#",
    "..###",
    "...#.o",
    "...#..o",
    "...#...ooo",
    "...#...o.o",
    "..###..ooo",
    "..#.#",
    "..###",
  ],
};

export default icon;
