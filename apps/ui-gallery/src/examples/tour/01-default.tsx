import { Button, Tour, type TourStep } from "@forgeron/ui";
import { useState } from "react";

const steps: TourStep[] = [
  {
    id: "tools",
    target: "#tour-tools",
    title: "Pick a tool",
    body: "The dock holds everything you draw with. Press its key to switch.",
    side: "right",
  },
  {
    id: "canvas",
    target: "#tour-canvas",
    title: "Draw here",
    body: "The canvas is infinite: hold Space and drag to move around.",
    side: "bottom",
  },
  {
    id: "zoom",
    target: "#tour-zoom",
    title: "Zoom and fit",
    body: "The percent opens a menu with fit and fill.",
    side: "top",
  },
  { id: "done", title: "That is all", body: "Press ? any time to see every shortcut." },
];

const box = (extra: React.CSSProperties): React.CSSProperties => ({
  position: "absolute",
  border: "1px solid var(--line-strong)",
  background: "var(--bg-raised)",
  font: "400 11px var(--font-mono)",
  color: "var(--ink-muted)",
  textTransform: "uppercase",
  padding: 6,
  ...extra,
});

export default function Default() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "flex-start",
        width: "100%",
      }}
    >
      <Button
        variant="primary"
        onClick={() => {
          setStep(0);
          setOpen(true);
        }}
      >
        Start the tour
      </Button>
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 520,
          height: 260,
          border: "1px solid var(--line-strong)",
          background: "var(--bg-sunk)",
        }}
      >
        <div id="tour-tools" style={box({ left: 12, top: 12, width: 40, height: 140 })}>
          Tools
        </div>
        <div id="tour-canvas" style={box({ left: 72, top: 20, right: 20, height: 150 })}>
          Canvas
        </div>
        <div id="tour-zoom" style={box({ right: 20, bottom: 14, width: 120, height: 36 })}>
          Zoom 100%
        </div>
      </div>
      <Tour
        label="Tour of the editor"
        steps={steps}
        open={open}
        onOpenChange={setOpen}
        step={step}
        onStepChange={setStep}
      />
    </div>
  );
}
