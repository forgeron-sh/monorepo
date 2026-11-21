import type { PixelIcon } from "../types";

// First line on the right: a box, in the secondary tone, beside two short lines, then two full lines.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-firstline-right",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oooo..####",
    ".o..o",
    ".o..o",
    ".oooo..####",
    "",
    "",
    ".##########",
    "",
    "",
    ".##########",
  ],
};

export default icon;
