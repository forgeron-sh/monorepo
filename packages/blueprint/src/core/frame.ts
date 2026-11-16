/**
 * The frame buffer: one entry per raster pixel, keeping what the pixel is made of (its material),
 * its colour family and its density. Filters read materials, so dither can shade faces without
 * ever reaching an edge or a letter.
 */

export const Material = {
  Empty: 0,
  FaceTop: 1,
  FaceLeft: 2,
  FaceRight: 3,
  /** Box outlines, lines, label leaders. */
  Edge: 4,
  /** Floors, vents, plate inset and ring: lines drawn on a face. */
  Detail: 5,
  Dot: 6,
  LabelFill: 7,
  LabelFrame: 8,
  LabelText: 9,
  /** Reserved for generator blocks (a field written pixel by pixel), shaded like a face. */
  Field: 10,
} as const;
export type Material = (typeof Material)[keyof typeof Material];

/** Palette slots. 0 is transparent. */
export const Slot = {
  None: 0,
  Bg: 1,
  Ink: 2,
  Dim: 3,
  Faint: 4,
  Accent: 5,
  Signal: 6,
} as const;
export type Slot = (typeof Slot)[keyof typeof Slot];

export type SlotName = "bg" | "ink" | "dim" | "faint" | "accent" | "signal";

/** Slot names in slot order, from `Slot.Bg`. */
export const SLOT_NAMES: readonly SlotName[] = ["bg", "ink", "dim", "faint", "accent", "signal"];

export function slotOf(name: SlotName): Slot {
  return (SLOT_NAMES.indexOf(name) + 1) as Slot;
}

export interface Frame {
  readonly width: number;
  readonly height: number;
  /** What each pixel is (`Material`). */
  readonly material: Uint8Array;
  /** Its colour family (`Slot`). */
  readonly ink: Uint8Array;
  /** Its density, 0 to 1: meaningful on faces and fields. */
  readonly tone: Float32Array;
  /** The resolved slot, written by the shading filters; 0 is transparent. */
  readonly color: Uint8Array;
}

export function createFrame(width: number, height: number): Frame {
  const n = width * height;
  return {
    width,
    height,
    material: new Uint8Array(n),
    ink: new Uint8Array(n),
    tone: new Float32Array(n),
    color: new Uint8Array(n),
  };
}

/** Faces and fields are the only materials a dither may shade. */
export function isShaded(material: number): boolean {
  return (
    material === Material.FaceTop ||
    material === Material.FaceLeft ||
    material === Material.FaceRight ||
    material === Material.Field
  );
}

export function isLabel(material: number): boolean {
  return (
    material === Material.LabelFill ||
    material === Material.LabelFrame ||
    material === Material.LabelText
  );
}
