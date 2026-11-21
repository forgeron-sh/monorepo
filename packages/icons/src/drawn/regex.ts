import type { PixelIcon } from "../types";

// Regular expression: an asterisk over a square dot, the `.*` of a pattern.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "regex",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........#",
    "......#.#.#",
    ".......###",
    "......#.#.#",
    "........#",
    "",
    "",
    ".###",
    ".###",
    ".###",
  ],
};

export default icon;
