import type { PixelIcon } from "../types";

// The CodeSandbox mark in pixels: a heavy square frame.
// 12×12: `#` primary tone. Rasterised from `simple-icons:codesandbox` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// CodeSandbox and the CodeSandbox logo are trademarks of CodeSandbox BV, used here only to refer to CodeSandbox.
const icon: PixelIcon = {
  name: "codesandbox",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "############",
    "############",
    "##........##",
    "##........##",
    "##........##",
    "##........##",
    "##........##",
    "##........##",
    "##........##",
    "##........##",
    "############",
    "############",
  ],
};

export default icon;
