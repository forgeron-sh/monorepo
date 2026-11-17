import type { PixelIcon } from "../types";

// A battery with a leaf inside.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "battery-eco-charging",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#########",
    ".#...ooo.#",
    ".#..o..o.##",
    ".#..o.o..##",
    ".#.o.o...#",
    ".#########",
  ],
};

export default icon;
