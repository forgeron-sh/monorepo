import type { PixelIcon } from "../types";

// Crab: a wide solid shell, two raised claws and three legs each side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "crab",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "#.#......#.#",
    "###......###",
    ".#........#",
    ".#..####..#",
    "..########",
    "#.########.#",
    ".#.######.#",
    "#...####...#",
    ".#........#",
  ],
};

export default icon;
