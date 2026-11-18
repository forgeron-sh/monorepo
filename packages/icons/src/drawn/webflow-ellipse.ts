import type { PixelIcon } from "../types";

// The Webflow W in the full-grid ring of `circle`, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "webflow-ellipse",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    "#.oo.oo.oo.#",
    "#.oo.oo.oo.#",
    "#.oooooooo.#",
    "#..ooo.ooo.#",
    ".#.oo..oo..#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
