import type { PixelIcon } from "../types";

// Database of `database-01` with a down arrow badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "database-import",
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
    ".#.##...o",
    ".#......o",
    ".#....o.o.o",
    ".##....ooo",
    "...##...o",
  ],
};

export default icon;
