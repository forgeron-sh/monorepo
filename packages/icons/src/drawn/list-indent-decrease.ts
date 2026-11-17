import type { PixelIcon } from "../types";

// Lines of text with an arrow pointing left: decrease the indent.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "list-indent-decrease",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "",
    "",
    "..o..######",
    ".oo",
    ".oo",
    "..o..######",
    "",
    "",
    ".##########",
  ],
};

export default icon;
