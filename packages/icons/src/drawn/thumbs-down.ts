import type { PixelIcon } from "../types";

// Thumbs down: `thumbs-up` turned by a half turn, as Hugeicons does.
// Redrawn after Hugeicons `thumbs-down` (Iconify preview, 2026-11-17): composition only.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "thumbs-down",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...########",
    "..#.....#.#",
    ".#......#.#",
    "..###...#.#",
    ".#......#.#",
    ".###....###",
    "....#...#",
    "....#..#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
