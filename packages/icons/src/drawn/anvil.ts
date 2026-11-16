import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`anvil`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "anvil",
  implemented: true,
  style: "pixel",
  grid: 12,
  rows: [
    "",
    "o.",
    "oo##########",
    ".o##########",
    "..########",
    "....####",
    ".....##",
    ".....##",
    "....####",
    "..########",
    "..########",
  ],
};

export default icon;
