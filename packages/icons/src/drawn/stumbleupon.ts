import type { PixelIcon } from "../types";

// The StumbleUpon mark in pixels: the joined "su", a hook on the left rising into an arch whose
// right leg stops short, then a "u" that starts under that leg after a one-pixel gap.
// 12×12: `#` primary tone, 12 × 9 pixels (the mark is 4:3). Drawn on 2026-11-18.
// simple-icons no longer carries the mark; rasterised from the reference `fa-brands:stumbleupon`
// (Iconify, 2026-11-18) at cell centres, then redrawn by hand: strokes made two pixels, the
// diagonal wedge between the arch and the "u" reduced to a one-row gap. Monotone. StumbleUpon and
// the StumbleUpon logo are trademarks of StumbleUpon, Inc., used here only to refer to
// StumbleUpon.
const icon: PixelIcon = {
  name: "stumbleupon",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....####",
    "...######",
    "...##..##",
    "...##..##",
    "...##",
    "##.##..##.##",
    "##.##..##.##",
    "#####..#####",
    ".###....###",
  ],
};

export default icon;
