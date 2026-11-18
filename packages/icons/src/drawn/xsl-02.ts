import type { PixelIcon } from "../types";

// XSL: the letters X, S and L alone, as `xsl-01` without the sheet.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "xsl-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#.#..##.#",
    ".#.#.#...#",
    "..#...#..#",
    ".#.#...#.#",
    ".#.#.##..###",
  ],
};

export default icon;
