import type { PixelIcon } from "../types";

// Apple in the secondary tone on a closed book lying flat.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "knowledge-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......o",
    "...oo.ooo",
    "...oooooo",
    "...oooooo",
    "....oooo",
    "",
    ".##########",
    "#.........#",
    "#.#########",
    "#.........#",
    ".##########",
  ],
};

export default icon;
