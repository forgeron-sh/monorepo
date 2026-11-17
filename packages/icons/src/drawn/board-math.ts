import type { PixelIcon } from "../types";

// Maths board: a board on two legs with a plus and an equals sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "board-math",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#..o..oo.#",
    ".#.ooo....#",
    ".#..o..oo.#",
    ".#........#",
    ".#........#",
    ".##########",
    "..#......#",
    ".#........#",
  ],
};

export default icon;
