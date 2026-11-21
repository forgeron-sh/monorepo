import type { PixelIcon } from "../types";

// WAV: the three letters W, A and V of `wav-01`, without the file, in the style of `tiff-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wav-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#.#..#..#.#",
    ".#.#.#.#.#.#",
    ".#.#.###.#.#",
    ".###.#.#.#.#",
    ".#.#.#.#..#",
  ],
};

export default icon;
