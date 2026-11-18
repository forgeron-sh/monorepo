import type { PixelIcon } from "../types";

// A database cylinder and a two-way diagonal arrow badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "database-expand",
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
    ".#.##...ooo",
    ".#.......oo",
    ".#....o.o.o",
    ".##...oo",
    "...##.ooo",
  ],
};

export default icon;
