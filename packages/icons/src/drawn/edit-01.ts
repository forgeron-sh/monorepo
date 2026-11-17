import type { PixelIcon } from "../types";

// Edit text: two short lines and a solid 45° pencil writing the third, the text in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "edit-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".ooooo....#",
    ".........##",
    "........##",
    ".oooo..##",
    "......##",
    "......#",
    ".ooo.#",
  ],
};

export default icon;
