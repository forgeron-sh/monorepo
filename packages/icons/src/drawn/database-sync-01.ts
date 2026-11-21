import type { PixelIcon } from "../types";

// The database cylinder with a sync loop in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "database-sync-01",
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
    ".#....o...o",
    ".#....oo..o",
    ".##...o..oo",
    "...##..ooo",
  ],
};

export default icon;
