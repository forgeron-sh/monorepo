import type { PixelIcon } from "../types";

// Jester hat: a central bell on top, two drooping points with bells, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "joker",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    ".....oo",
    "oo..####..oo",
    "oo.#....#.oo",
    "..#......#",
    ".#........#",
    ".##########",
    ".##########",
  ],
};

export default icon;
