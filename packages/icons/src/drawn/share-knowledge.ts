import type { PixelIcon } from "../types";

// Share knowledge: a closed book with the share nodes of `share-01` above it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "share-knowledge",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......oooo",
    "....oo..oo",
    "..oo",
    "..oo",
    "....oo..oo",
    "......oooo",
    "",
    ".##########",
    "#.........#",
    "#.#########",
    "#.........#",
    ".##########",
  ],
};

export default icon;
