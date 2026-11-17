import type { PixelIcon } from "../types";

// Database: a cylinder with its top face and one band, lighter than `database` (two bands and a secondary band).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "database-01",
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
    ".#........#",
    ".#.######.#",
    ".#........#",
    ".#........#",
    ".##......##",
    "...######",
  ],
};

export default icon;
