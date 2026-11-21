import type { PixelIcon } from "../types";

// Tower: a narrow block with three windows in the secondary tone and a door, on a ground line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "building-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "...#....#",
    "...#.oo.#",
    "...#....#",
    "...#.oo.#",
    "...#....#",
    "...#.oo.#",
    "...#....#",
    "...#.##.#",
    ".##########",
  ],
};

export default icon;
