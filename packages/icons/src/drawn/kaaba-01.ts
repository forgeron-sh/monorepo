import type { PixelIcon } from "../types";

// Kaaba solid: the cube of `kaaba-02` with solid faces, the band in the secondary tone around both.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "kaaba-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#########",
    ".#########.#",
    "##########.#",
    "#########.##",
    "ooooooooo.o#",
    "#########.##",
    "#########.##",
    "#########.##",
    "#########.##",
    "#########.#",
    "#########",
  ],
};

export default icon;
