import type { PixelIcon } from "../types";

// Cylinder: the top ellipse of `database` over plain sides and a rounded bottom.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cylinder-01",
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
    ".#........#",
    ".#........#",
    ".#........#",
    ".##......##",
    "...######",
  ],
};

export default icon;
