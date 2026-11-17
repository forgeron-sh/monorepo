import type { PixelIcon } from "../types";

// Indent: the lines of text-align-left, the middle two indented beside an arrowhead in the
// secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-indent",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "",
    "",
    ".o...######",
    ".oo",
    ".oo",
    ".o...######",
    "",
    "",
    ".##########",
  ],
};

export default icon;
