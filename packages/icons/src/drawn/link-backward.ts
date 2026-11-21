import type { PixelIcon } from "../types";

// Link bracket on the right with an arrow pointing back to the left in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "link-backward",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....oo",
    "...oo..###",
    "..oo......#",
    ".oooooooo.#",
    ".oooooooo.#",
    "..oo......#",
    "...oo..###",
    "....oo",
  ],
};

export default icon;
