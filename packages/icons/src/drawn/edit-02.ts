import type { PixelIcon } from "../types";

// Pencil at 45°: two parallel one-pixel edges, a flat cap, the point on the lower left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "edit-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........##",
    ".......#..#",
    "......#..#",
    ".....#..#",
    "....#..#",
    "...#..#",
    "..#..#",
    ".#..#",
    ".#.#",
    ".##",
  ],
};

export default icon;
