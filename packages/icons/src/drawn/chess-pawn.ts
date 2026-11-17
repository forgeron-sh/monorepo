import type { PixelIcon } from "../types";

// Chess pawn: a round head over a collar and a flared base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chess-pawn",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....##",
    "....#..#",
    "....#..#",
    "...######",
    "....#..#",
    "....#..#",
    "...#....#",
    "..#......#",
    ".##########",
  ],
};

export default icon;
