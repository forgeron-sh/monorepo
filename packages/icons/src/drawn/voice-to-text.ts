import type { PixelIcon } from "../types";

// Voice to text: sound bars on the left, lines of text on the right in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "voice-to-text",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...#",
    "...#.#.oooo",
    ".#.#.#",
    ".#.#.#.oooo",
    ".#.#.#",
    ".#.#.#.oo",
    "...#.#",
    "...#",
  ],
};

export default icon;
