import type { PixelIcon } from "../types";

// Actual size: a landscape frame with `1:1` in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "image-actual-size",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "############",
    "#..........#",
    "#.oo....oo.#",
    "#..o.oo..o.#",
    "#..o.....o.#",
    "#..o.oo..o.#",
    "#..........#",
    "############",
  ],
};

export default icon;
