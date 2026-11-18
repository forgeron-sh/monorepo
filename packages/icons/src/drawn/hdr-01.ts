import type { PixelIcon } from "../types";

// HDR: the letters H, D and R.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hdr-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "#.#.##..##",
    "#.#.#.#.#.#",
    "###.#.#.#.#",
    "#.#.#.#.##",
    "#.#.#.#.#.#",
    "#.#.##..#.#",
  ],
};

export default icon;
