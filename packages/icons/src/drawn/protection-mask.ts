import type { PixelIcon } from "../types";

// Face mask: a pleated mask with ear loops on both sides, one pleat in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "protection-mask",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..########",
    "###......###",
    "#.#.oooo.#.#",
    "#.#......#.#",
    "###.####.###",
    "..#......#",
    "...######",
  ],
};

export default icon;
