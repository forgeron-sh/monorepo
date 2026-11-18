import type { PixelIcon } from "../types";

// Justified text whose last line is short and flush right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-align-justify-right",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "",
    "",
    ".##########",
    "",
    "",
    ".##########",
    "",
    "",
    ".....######",
  ],
};

export default icon;
