import type { PixelIcon } from "../types";

// AI chip: a chip with pins and the letters AI in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ai-chip",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....#..#",
    ".##########",
    ".#........#",
    ".#..o...o.#",
    "##.o.o..o.##",
    ".#.ooo..o.#",
    ".#.o.o..o.#",
    "##.o.o..o.##",
    ".#........#",
    ".#........#",
    ".##########",
    "....#..#",
  ],
};

export default icon;
