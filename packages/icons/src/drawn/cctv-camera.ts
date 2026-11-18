import type { PixelIcon } from "../types";

// Security camera: a box camera with its lens in the secondary tone, on an arm fixed to a wall.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cctv-camera",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#########",
    "o#.......#",
    "o#.......#.#",
    ".#########.#",
    "......#....#",
    "......######",
    "...........#",
    "...........#",
  ],
};

export default icon;
