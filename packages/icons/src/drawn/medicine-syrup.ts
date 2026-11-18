import type { PixelIcon } from "../types";

// Syrup bottle: a cap, a short neck and a body with a drop in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "medicine-syrup",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "...######",
    "....#..#",
    "..##....##",
    "..#..oo..#",
    "..#..oo..#",
    "..#.oooo.#",
    "..#.oooo.#",
    "..#..oo..#",
    "..########",
  ],
};

export default icon;
