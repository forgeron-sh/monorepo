import type { PixelIcon } from "../types";

// Ring-bound notebook with index tabs on its edge, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "notebook-tabs",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...########",
    "...#......#o",
    ".###......#o",
    "...#.####.#",
    "...#......#",
    "...#......#o",
    "...#......#o",
    ".###......#",
    "...#......#",
    "...########",
  ],
};

export default icon;
