import type { PixelIcon } from "../types";

// Nintendo: a handheld console seen from the front, the screen between two controllers with their
// sticks.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "nintendo",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    "###......###",
    "#.#......###",
    "###......#.#",
    "###......###",
    "###......###",
    ".##########",
  ],
};

export default icon;
