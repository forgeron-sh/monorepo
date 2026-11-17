import type { PixelIcon } from "../types";

// Database of `database-01` with the padlock badge of `folder-lock`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "database-locked",
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
    ".#.##..ooo",
    ".#.....o.o",
    ".#....ooooo",
    ".##...oo.oo",
    "...##.ooooo",
  ],
};

export default icon;
