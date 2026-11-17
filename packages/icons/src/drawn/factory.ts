import type { PixelIcon } from "../types";

// Factory: a chimney, a saw-tooth roof, a window in the secondary tone and a door.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "factory",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##",
    ".##",
    ".##..#..#",
    ".##.##.##",
    ".####.##.##",
    ".#........#",
    ".#.oo.....#",
    ".#.oo..##.#",
    ".#.....##.#",
    ".##########",
  ],
};

export default icon;
