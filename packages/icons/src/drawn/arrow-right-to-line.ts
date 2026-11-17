import type { PixelIcon } from "../types";

// A rightward arrow stopping at a line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-right-to-line",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....##....#",
    ".....##...#",
    "......##..#",
    ".########.#",
    ".########.#",
    "......##..#",
    ".....##...#",
    "....##....#",
  ],
};

export default icon;
