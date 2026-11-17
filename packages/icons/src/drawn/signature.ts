import type { PixelIcon } from "../types";

// Signature.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "signature",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    ".oo....oo",
    "o..o..o..o",
    "....oo....o",
    "",
    "",
    ".##########",
  ],
};

export default icon;
