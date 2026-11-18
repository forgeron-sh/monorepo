import type { PixelIcon } from "../types";

// The Google Docs mark: a page with a cut corner and lines of text cut out of it.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "google-doc",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".######",
    ".#######",
    ".########",
    ".#########",
    ".##########",
    ".##......##",
    ".##########",
    ".##......##",
    ".##########",
    ".##....####",
    ".##########",
    ".##########",
  ],
};

export default icon;
