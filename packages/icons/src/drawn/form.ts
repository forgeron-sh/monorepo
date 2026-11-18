import type { PixelIcon } from "../types";

// Form: two labelled input fields and a submit button in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "form",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###",
    ".##########",
    ".#........#",
    ".##########",
    "",
    ".###",
    ".##########",
    ".#........#",
    ".##########",
    "",
    "......ooooo",
  ],
};

export default icon;
