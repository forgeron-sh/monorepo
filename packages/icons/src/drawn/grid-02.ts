import type { PixelIcon } from "../types";

// Nine small squares, an apps grid.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "grid-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##..##..##",
    ".##..##..##",
    "",
    "",
    ".##..##..##",
    ".##..##..##",
    "",
    "",
    ".##..##..##",
    ".##..##..##",
  ],
};

export default icon;
