import type { PixelIcon } from "../types";

// The YouTube mark: a wide rounded rectangle with a play triangle cut out of it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "youtube",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    "####.#######",
    "####..######",
    "####...#####",
    "####...#####",
    "####..######",
    "####.#######",
    ".##########",
  ],
};

export default icon;
