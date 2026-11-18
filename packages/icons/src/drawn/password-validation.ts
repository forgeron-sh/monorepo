import type { PixelIcon } from "../types";

// Password field: a frame with three masked characters in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "password-validation",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "############",
    "#..........#",
    "#.oo.oo.oo.#",
    "#.oo.oo.oo.#",
    "#..........#",
    "############",
  ],
};

export default icon;
