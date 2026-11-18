import type { PixelIcon } from "../types";

// Retro game pad: a rectangle with a cross pad and two buttons in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "game-controller-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".##########",
    ".#........#",
    ".#..#...o.#",
    ".#.###.o..#",
    ".#..#.....#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
