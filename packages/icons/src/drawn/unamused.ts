import type { PixelIcon } from "../types";

// A face with half-closed eyes glancing aside and a flat mouth: unamused. Face of `neutral`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "unamused",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#.##..##.#",
    ".#..#...#.#",
    ".#........#",
    ".#........#",
    ".#....ooo.#",
    "..#......#",
    "...######",
  ],
};

export default icon;
