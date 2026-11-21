import type { PixelIcon } from "../types";

// Triangle list: a small triangle in the secondary tone beside a long and a short line, laid out like `left-to-right-list-number`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "left-to-right-list-triangle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".o",
    ".oo..######",
    ".o",
    ".....####",
    "",
    "",
    ".o",
    ".oo..######",
    ".o",
    ".....####",
  ],
};

export default icon;
