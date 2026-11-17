import type { PixelIcon } from "../types";

// A siren: a domed light on its base, with light rays above.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "siren",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o....oo....o",
    ".o...oo...o",
    "",
    "....####",
    "...#....#",
    "...#.##.#",
    "...#.##.#",
    "...#....#",
    ".##########",
    ".#........#",
    ".##########",
  ],
};

export default icon;
