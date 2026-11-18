import type { PixelIcon } from "../types";

// A towel hanging over a rack.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "towel-rack",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "#.oooooooo.#",
    "############",
    "..o......o",
    "..o......o",
    "..o......o",
    "..o......o",
    "..oooooooo",
    "..o......o",
    "..oooooooo",
  ],
};

export default icon;
