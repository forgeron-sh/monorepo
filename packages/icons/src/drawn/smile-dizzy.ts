import type { PixelIcon } from "../types";

// A smiling face with crossed, dizzy eyes.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "smile-dizzy",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#.#.#.#.#",
    ".#..#..#.#",
    ".#.#.#.#.#",
    ".#........#",
    ".#.o....o.#",
    ".#..oooo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
