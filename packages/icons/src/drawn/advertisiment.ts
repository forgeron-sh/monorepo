import type { PixelIcon } from "../types";

// Advertisement: the letters A and D in a rounded frame.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "advertisiment",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "#..........#",
    "#..#...##..#",
    "#.#.#..#.#.#",
    "#.#.#..#.#.#",
    "#.###..#.#.#",
    "#.#.#..#.#.#",
    "#.#.#..##..#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
