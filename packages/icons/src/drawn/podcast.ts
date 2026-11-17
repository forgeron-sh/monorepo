import type { PixelIcon } from "../types";

// Podcast: two open arcs around a microphone head and stem in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "podcast",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#..####..#",
    ".#.#....#.#",
    ".#.#.oo.#.#",
    "..#..oo..#",
    "",
    ".....oo",
    ".....oo",
    ".....oo",
  ],
};

export default icon;
