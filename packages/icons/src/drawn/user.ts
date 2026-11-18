import type { PixelIcon } from "../types";

// One person: a round head over rounded shoulders, one-pixel outline.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the head.
const icon: PixelIcon = {
  name: "user",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....oooo",
    "...o....o",
    "...o....o",
    "...o....o",
    "....oooo",
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
