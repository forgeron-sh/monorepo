import type { PixelIcon } from "../types";

// Green lab: the flask of `flask-conical`, a sprout in the secondary tone inside.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "eco-lab",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "....#..#",
    "....#..#",
    "...#....#",
    "..#......#",
    ".#........#",
    ".#.oo..oo.#",
    ".#...oo...#",
    ".#...oo...#",
    ".##########",
  ],
};

export default icon;
