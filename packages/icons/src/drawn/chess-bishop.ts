import type { PixelIcon } from "../types";

// Chess bishop: a mitre with a diagonal slit, a collar and a flared base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chess-bishop",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#..#.#",
    "...#.#..#",
    "....#..#",
    "...######",
    "....#..#",
    "...#....#",
    "..#......#",
    ".##########",
  ],
};

export default icon;
