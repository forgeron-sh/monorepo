import type { PixelIcon } from "../types";

// Dumbbell: a two-pixel bar between two pairs of plates.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dumbbell-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".##......##",
    "###......###",
    "############",
    "############",
    "###......###",
    ".##......##",
  ],
};

export default icon;
