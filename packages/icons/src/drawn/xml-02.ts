import type { PixelIcon } from "../types";

// XML: the letters X, M and L alone, as `xml-01` without the sheet.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "xml-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#.#.#.#.#",
    ".#.#.###.#",
    "..#..#.#.#",
    ".#.#.#.#.#",
    ".#.#.#.#.###",
  ],
};

export default icon;
