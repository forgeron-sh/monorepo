import type { PixelIcon } from "../types";

// Relieved face: the smile face with closed eyes drawn as short lines.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "relieved-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
    ".#.##..##.#",
    ".#........#",
    ".#.o....o.#",
    ".#..oooo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
