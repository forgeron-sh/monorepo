import type { PixelIcon } from "../types";

// Route: a start node, a winding path, the destination node in the secondary tone; symmetric by a
// half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "route-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###",
    ".#.#",
    ".###",
    "..#",
    "..#....###",
    "...###....#",
    ".........#",
    "........ooo",
    "........o.o",
    "........ooo",
  ],
};

export default icon;
