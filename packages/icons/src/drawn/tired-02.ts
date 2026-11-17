import type { PixelIcon } from "../types";

// Yawning face: the round face of `tired-01` with closed eyes and an open mouth in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tired-02",
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
    ".#........#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#...oo...#",
    "..#......#",
    "...######",
  ],
};

export default icon;
