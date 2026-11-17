import type { PixelIcon } from "../types";

// Film strip: perforated edges and a frame.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "film-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#.#....#.#",
    ".###....###",
    ".#.#....#.#",
    ".###....###",
    ".#.#....#.#",
    ".###....###",
    ".#.#....#.#",
    ".###....###",
    ".##########",
  ],
};

export default icon;
