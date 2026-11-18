import type { PixelIcon } from "../types";

// A barn front: a gambrel roof over a big door crossed in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "barns",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..##....##",
    ".#........#",
    "##........##",
    ".#.######.#",
    ".#.#o..o#.#",
    ".#.#.oo.#.#",
    ".#.#.oo.#.#",
    ".#.#o..o#.#",
    ".##########",
  ],
};

export default icon;
