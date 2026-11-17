import type { PixelIcon } from "../types";

// Speech to text: a sound wave in the secondary tone beside lines of text.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "speech-to-text",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...o",
    "...o...####",
    "...o.o",
    ".o.o.o.####",
    ".o.o.o",
    "...o.o.####",
    "...o",
    "...o",
  ],
};

export default icon;
