import type { PixelIcon } from "../types";

// Stroke inside: a dashed outer square, the path, and a solid square inside it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "stroke-inside",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##..##..##",
    ".#........#",
    "...oooooo",
    "...o....o",
    ".#.o....o.#",
    ".#.o....o.#",
    "...o....o",
    "...oooooo",
    ".#........#",
    ".##..##..##",
  ],
};

export default icon;
