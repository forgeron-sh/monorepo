import type { PixelIcon } from "../types";

// Area chart inside a frame, the area in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#......o.#",
    ".#.....oo.#",
    ".#..o.ooo.#",
    ".#.oooooo.#",
    ".#oooooooo#",
    ".#oooooooo#",
    ".#oooooooo#",
    ".##########",
  ],
};

export default icon;
