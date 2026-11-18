import type { PixelIcon } from "../types";

// The Trello mark: a rounded board with a tall and a short list cut out of it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "trello",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".##########",
    ".##..##..##",
    ".##..##..##",
    ".##..##..##",
    ".##..######",
    ".##..######",
    ".##..######",
    ".##########",
    "..########",
  ],
};

export default icon;
