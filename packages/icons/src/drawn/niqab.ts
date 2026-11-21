import type { PixelIcon } from "../types";

// Niqab: the headscarf of `hijab` covering the face, with only an eye slit.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "niqab",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....oooo",
    "...o....o",
    "..o......o",
    "..o......o",
    "..o.####.o",
    "..o......o",
    "..o......o",
    ".o........o",
    ".o........o",
    "o..........o",
    "oooooooooooo",
  ],
};

export default icon;
