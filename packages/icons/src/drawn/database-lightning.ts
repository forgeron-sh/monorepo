import type { PixelIcon } from "../types";

// A database cylinder and a lightning bolt badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "database-lightning",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    ".##......##",
    ".#.######.#",
    ".#........#",
    ".#",
    ".#.##....oo",
    ".#......oo",
    ".#.....oooo",
    ".##.....oo",
    "...##..oo",
  ],
};

export default icon;
