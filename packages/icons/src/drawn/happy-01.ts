import type { PixelIcon } from "../types";

// Happy face with closed, upturned eyes and a smile in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "happy-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#..#..#..#",
    ".#.#.##.#.#",
    ".#........#",
    ".#.o....o.#",
    ".#..oooo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
