import type { PixelIcon } from "../types";

// The Asana mark, 16×16: three round dots in a triangle, one on top and two below. On 12×12 the
// dots were four pixels wide and read as plus signs (tried on 2026-11-17), so it takes 16, with
// six-pixel dots and two-pixel gaps. Rasterised from `simple-icons:asana` (Iconify, 2026-11-17),
// then redrawn. Monotone.
const icon: PixelIcon = {
  name: "asana",
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    "",
    "......####",
    ".....######",
    ".....######",
    ".....######",
    ".....######",
    "......####",
    "",
    "",
    "..####....####",
    ".######..######",
    ".######..######",
    ".######..######",
    ".######..######",
    "..####....####",
  ],
};

export default icon;
