import type { PixelIcon } from "../types";

// Chopsticks: two parallel sticks resting in a bowl.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chopsticks",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........#..#",
    ".......#..#",
    "......#..#",
    ".....#..#",
    "....#..#",
    "...#..#",
    ".##########",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
