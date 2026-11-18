import type { PixelIcon } from "../types";

// The IconJar logo mark in pixels: a jar with a knob on its lid, the lid standing apart from the
// body, and the slit that splits the jar's shoulders and runs down into the body. Rasterised from
// the reference `simple-icons:iconjar` (Iconify, 2026-11-18), then redrawn by hand. Monotone.
// IconJar and the IconJar logo are trademarks of their owners, used here only to refer to IconJar.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "iconjar",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "..########",
    "",
    "..#####.##",
    "...####.#",
    ".######.###",
    ".######.###",
    ".######.###",
    ".##########",
    ".##########",
    "..########",
    "...######",
  ],
};

export default icon;
