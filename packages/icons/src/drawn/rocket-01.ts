import type { PixelIcon } from "../types";

// Rocket standing up: a nose, a porthole, two fins, the flame in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rocket-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "...#.##.#",
    "...#.##.#",
    "...#....#",
    "..##....##",
    ".#.#....#.#",
    ".#.######.#",
    ".....oo",
  ],
};

export default icon;
