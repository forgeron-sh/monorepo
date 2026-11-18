import type { PixelIcon } from "../types";

// The Mistral AI mark, 16×16: the M built of square blocks, two pillars, the steps between them
// and the wide base with its gap. Rasterised from `simple-icons:mistralai` (Iconify, 2026-11-17),
// then redrawn on whole blocks: the anti-aliased corners dropped. Monotone.
const icon: PixelIcon = {
  name: "mistral",
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..###......###",
    "..###......###",
    "..#####..#####",
    "..#####..#####",
    "..############",
    "..############",
    "..###..##..###",
    "..###..##..###",
    "################",
    "#######..#######",
    "#######..#######",
  ],
};

export default icon;
