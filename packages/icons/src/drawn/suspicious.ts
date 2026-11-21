import type { PixelIcon } from "../types";

// A round face with narrowed eyes and a mouth pushed to one side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "suspicious",
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
    ".#........#",
    ".#....ooo.#",
    "..#......#",
    "...######",
  ],
};

export default icon;
