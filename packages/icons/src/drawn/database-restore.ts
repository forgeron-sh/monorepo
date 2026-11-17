import type { PixelIcon } from "../types";

// A database cylinder and a counter-clockwise arrow badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "database-restore",
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
    ".#.##.o.oo",
    ".#....oo..o",
    ".#....ooo.o",
    ".##.......o",
    "...##..ooo",
  ],
};

export default icon;
