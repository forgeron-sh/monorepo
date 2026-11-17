import type { PixelIcon } from "../types";

// Dash list: a dash in the secondary tone beside a long and a short line, laid out like `left-to-right-list-number`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "left-to-right-list-dash",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".oo..######",
    "",
    ".....####",
    "",
    "",
    "",
    ".oo..######",
    "",
    ".....####",
  ],
};

export default icon;
