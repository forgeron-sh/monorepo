import type { PixelIcon } from "../types";

// Bedug hanging: the barrel drum of `bedug-01` hung from a beam between two posts.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bedug-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "############",
    "#..........#",
    "#..#....#..#",
    "#.oo#####..#",
    "#o..o....#.#",
    "#o..o....#.#",
    "#o..o....#.#",
    "#.oo#####..#",
    "#..........#",
    "#..........#",
    "#..........#",
  ],
};

export default icon;
