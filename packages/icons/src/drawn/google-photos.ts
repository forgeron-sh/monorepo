import type { PixelIcon } from "../types";

// The Google Photos mark: a pinwheel of four half-round blades turning around the centre, in
// alternating tones.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "google-photos",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....##",
    "...###",
    "...###",
    "...###.oooo",
    "...###oooooo",
    "....##oooooo",
    "oooooo##",
    "oooooo###",
    ".oooo.###",
    "......###",
    "......###",
    "......##",
  ],
};

export default icon;
