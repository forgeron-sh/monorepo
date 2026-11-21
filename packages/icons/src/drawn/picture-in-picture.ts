import type { PixelIcon } from "../types";

// Picture in picture: a wide frame with a small solid picture in its lower right in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "picture-in-picture",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#...oooo.#",
    ".#...oooo.#",
    ".#...oooo.#",
    ".##########",
  ],
};

export default icon;
