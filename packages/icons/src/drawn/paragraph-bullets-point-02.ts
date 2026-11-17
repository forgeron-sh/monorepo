import type { PixelIcon } from "../types";

// Bulleted paragraphs: two bullets in the secondary tone, each with a long first line and a shorter indented second line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "paragraph-bullets-point-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oo.#######",
    "",
    "",
    "....#####",
    "",
    "",
    ".oo.#######",
    "",
    "",
    "....#####",
  ],
};

export default icon;
