import type { PixelIcon } from "../types";

// Paragraph spacing: two pairs of text lines, a double arrow beside them in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "paragraph-spacing",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..o...######",
    ".ooo",
    "o.o.o.######",
    "..o",
    "..o",
    "..o",
    "..o",
    "o.o.o.######",
    ".ooo",
    "..o...######",
  ],
};

export default icon;
