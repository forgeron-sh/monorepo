import type { PixelIcon } from "../types";

// List with a minus in the secondary tone after its last, shorter line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "list-minus",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    "",
    "",
    ".##########",
    "",
    "",
    ".######.ooo",
  ],
};

export default icon;
