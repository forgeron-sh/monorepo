import type { PixelIcon } from "../types";

// Colour picker: an eyedropper at 45°, a solid bulb, a collar, a thin tube and the drop in the
// secondary tone (a two-line tube first read as a quill).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "color-picker",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........##",
    "........###",
    "......#.##",
    ".......#",
    "......#.#",
    ".....#",
    "....#",
    "...#",
    "..o",
    ".o",
  ],
};

export default icon;
