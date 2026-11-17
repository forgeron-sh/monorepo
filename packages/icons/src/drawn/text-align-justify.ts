import type { PixelIcon } from "../types";

// Four full-width lines of justified text. Same rows as `text-align-left`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-align-justify",
  implemented: true,
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
    ".##########",
  ],
};

export default icon;
