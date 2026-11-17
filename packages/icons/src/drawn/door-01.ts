import type { PixelIcon } from "../types";

// Door: a frame on a floor line, the knob in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "door-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#....o.#",
    "..#....o.#",
    "..#......#",
    "..#......#",
    "..#......#",
    ".##########",
  ],
};

export default icon;
