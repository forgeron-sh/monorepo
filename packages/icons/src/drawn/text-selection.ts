import type { PixelIcon } from "../types";

// Text selection: an I-beam cursor, in the secondary tone, beside a small letter a; the cursor of cursor-text.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-selection",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "oo.oo",
    "..o",
    "..o",
    "..o.....ooo",
    "..o.......o",
    "..o.....ooo",
    "..o....o..o",
    "..o.....ooo",
    "..o",
    "oo.oo",
  ],
};

export default icon;
