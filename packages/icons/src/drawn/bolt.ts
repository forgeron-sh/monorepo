import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`bolt`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "bolt",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......oo",
    ".....oo",
    "....oo",
    "...oooooo",
    "......oo",
    ".....oo",
    "....oo",
    "...oo",
    "",
    "#.#.#.#.#.#",
  ],
};

export default icon;
