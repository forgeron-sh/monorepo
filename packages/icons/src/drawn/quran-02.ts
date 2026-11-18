import type { PixelIcon } from "../types";

// Quran on its rehal: an open book resting on a crossed stand in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "quran-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".####..####",
    "#....##....#",
    "#....##....#",
    "#....##....#",
    "#....##....#",
    "#....##....#",
    "############",
    "....o..o",
    ".....oo",
    ".....oo",
    "....o..o",
    "...o....o",
  ],
};

export default icon;
