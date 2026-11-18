import type { PixelIcon } from "../types";

// A card held above the offering hand of the set (`hold-01`), the card in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "payment-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "......oooooo",
    "......oooooo",
    "......o....o",
    "......o....o",
    "....#.oooooo",
    "#..#",
    "#.#########",
    "#.####",
    "#.########",
  ],
};

export default icon;
