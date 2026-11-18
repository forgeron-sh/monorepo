import type { PixelIcon } from "../types";

// Initial: a letter A, in the secondary tone, set beside two short lines above two full lines, like a drop cap.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-initial",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..oo...####",
    ".o..o",
    ".oooo..####",
    ".o..o",
    "",
    "",
    ".##########",
    "",
    "",
    ".##########",
  ],
};

export default icon;
