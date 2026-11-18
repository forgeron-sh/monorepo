import type { PixelIcon } from "../types";

// A timeline: three events strung on a vertical line, each with a label.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "timeline",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".ooo",
    ".o.o.######",
    ".ooo",
    "..#",
    ".ooo",
    ".o.o.####",
    ".ooo",
    "..#",
    ".ooo",
    ".o.o.#######",
    ".ooo",
  ],
};

export default icon;
