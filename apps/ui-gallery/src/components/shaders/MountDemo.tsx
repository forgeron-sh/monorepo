import { Hearth, mountDitheredImage, PixelReveal } from "@forgeron/ui";
import { useEffect, useRef, useState } from "react";
import type { DemoSpec } from "../../lib/shaders";
import { forgePicture } from "../../shaders/picture";

type MountSpec = Extract<DemoSpec, { kind: "image" | "hearth" | "reveal" }>;

/**
 * The effects a preset cannot carry alone, through their mount: their source needs data from the
 * page (a picture, a word in the pixel face, a text). Every other demo is a `PresetDemo`.
 */
export default function MountDemo({ spec }: { spec: MountSpec }) {
  switch (spec.kind) {
    case "image":
      return <ImageDemo pixel={spec.pixel} gain={spec.gain} raw={spec.raw} />;
    case "hearth":
      return <Hearth text={spec.text} cell={spec.cell} still={spec.still} className="sh-hearth" />;
    case "reveal":
      return <RevealDemo text={spec.text} pixel={spec.pixel} duration={spec.duration} />;
  }
}

/** The dithered image of a picture drawn on the spot (no file to ship), or the picture itself. */
function ImageDemo({ pixel, gain, raw }: { pixel?: number; gain?: number; raw?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const src = forgePicture();
    if (!raw) {
      const handle = mountDitheredImage(canvas, src, { pixel, gain });
      return () => handle?.destroy();
    }
    const img = new Image();
    img.onload = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      const ctx = canvas.getContext("2d");
      const r = Math.max(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * r;
      const h = img.height * r;
      ctx?.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    };
    img.src = src;
    return () => {
      img.onload = null;
    };
  }, [pixel, gain, raw]);
  return <canvas ref={ref} className="fg-shader" aria-hidden="true" />;
}

/** The reveal with a button to play it again. */
function RevealDemo({
  text,
  pixel,
  duration,
}: {
  text: string;
  pixel?: number;
  duration?: number;
}) {
  const [replay, setReplay] = useState(0);
  return (
    <div className="sh-reveal">
      <PixelReveal text={text} pixel={pixel} duration={duration} replay={replay} />
      <button
        type="button"
        className="btn btn-sm sh-replay"
        onClick={() => setReplay((n) => n + 1)}
      >
        Replay
      </button>
    </div>
  );
}
