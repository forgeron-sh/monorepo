import type { PixelIcon } from "../types";

// Syringe at 45°: a plunger with its thumb rest, a barrel with flanges, the liquid in the secondary tone, the needle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "syringe",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........#",
    "........##",
    ".......##.#",
    "......#..#",
    ".....#..#",
    "....#oo#",
    "...#oo#",
    "..#oo#",
    "...##",
    "..#",
    ".#",
  ],
};

export default icon;
