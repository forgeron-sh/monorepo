import type { PixelIcon } from "../types";

// List with a cross on its last line: clear the list.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "list-x",
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
    "........o.o",
    ".######..o",
    "........o.o",
  ],
};

export default icon;
