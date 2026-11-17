import type { PixelIcon } from "../types";

// A skull: a round cranium, two eye sockets, a nose and a narrow jaw.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "skull",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#.##..##.#",
    ".#.##..##.#",
    ".#........#",
    "..##....##",
    "...#.##.#",
    "...#....#",
    "...######",
  ],
};

export default icon;
