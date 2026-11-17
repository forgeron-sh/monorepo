import type { PixelIcon } from "../types";

// First line on the left: two short lines beside a box, in the secondary tone, then two full lines.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-firstline-left",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####..oooo",
    ".......o..o",
    ".......o..o",
    ".####..oooo",
    "",
    "",
    ".##########",
    "",
    "",
    ".##########",
  ],
};

export default icon;
