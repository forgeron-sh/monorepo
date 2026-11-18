import type { PixelIcon } from "../types";

// Handheld console: a tall body with its screen, a cross pad and two buttons in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "gameboy",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    ".#........#",
    ".#.######.#",
    ".#.#....#.#",
    ".#.#....#.#",
    ".#.######.#",
    ".#........#",
    ".#..#...o.#",
    ".#.###.o..#",
    ".#..#.....#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
