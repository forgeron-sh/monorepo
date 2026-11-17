import type { PixelIcon } from "../types";

// Notebook: a cover with a label, two spiral rings in the secondary tone on its spine.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "notebook",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...########",
    "...#......#",
    ".ooo......#",
    "...#.####.#",
    "...#......#",
    "...#......#",
    "...#......#",
    ".ooo......#",
    "...#......#",
    "...########",
  ],
};

export default icon;
