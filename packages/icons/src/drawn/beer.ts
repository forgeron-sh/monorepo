import type { PixelIcon } from "../types";

// Beer mug: a glass and handle under a head of foam in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "beer",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..ooo.oo",
    ".oooooooo",
    ".#......#",
    ".#......###",
    ".#......#.#",
    ".#......#.#",
    ".#......#.#",
    ".#......###",
    ".#......#",
    ".########",
  ],
};

export default icon;
