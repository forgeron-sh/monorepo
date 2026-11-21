import {
  SignaturePad,
  SignaturePadDraw,
  SignaturePadModes,
  SignaturePadPreview,
  SignaturePadType,
} from "@forgeron/ui";

// Draw and type only; the upload tab is not offered.
export default function Composed() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <SignaturePad label="Your signature" modes={["draw", "type"]}>
        <SignaturePadModes />
        <SignaturePadDraw />
        <SignaturePadType />
        <SignaturePadPreview />
      </SignaturePad>
    </div>
  );
}
