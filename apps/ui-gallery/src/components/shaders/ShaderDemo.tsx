import { DitherField, FieldShader, Hearth, mountDitheredImage, PixelReveal } from "@forgeron/ui";
import { useEffect, useRef, useState } from "react";
import type { DemoSpec } from "../../lib/shaders";
import { mountBurn } from "../../shaders/burn";
import { forgePicture } from "../../shaders/picture";

/** One shader demo, by spec: a single island type for every demo of the Shaders section. */
export default function ShaderDemo({ spec }: { spec: DemoSpec }) {
  switch (spec.kind) {
    case "dither-field":
      return <DitherField pixel={spec.pixel} tones={spec.tones} still={spec.still} />;
    case "field":
      return (
        <FieldShader
          mode={spec.mode}
          pixel={spec.pixel}
          accent={spec.accent}
          still={spec.still}
          style={spec.opacity ? { opacity: spec.opacity, mixBlendMode: "screen" } : undefined}
        />
      );
    case "image":
      return <ImageDemo pixel={spec.pixel} gain={spec.gain} raw={spec.raw} />;
    case "hearth":
      return <Hearth text={spec.text} cell={spec.cell} still={spec.still} className="sh-hearth" />;
    case "reveal":
      return <RevealDemo text={spec.text} pixel={spec.pixel} duration={spec.duration} />;
    case "burn":
      return <BurnDemo mode={spec.mode} />;
    default:
      return null;
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

/** The burn over a dither field standing in for the site's village. */
function BurnDemo({ mode }: { mode: "close" | "open" }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const handle = mountBurn(ref.current, { mode });
    return () => handle?.destroy();
  }, [mode]);
  return (
    <div className="sh-burn">
      <FieldShader mode="globe" pixel={4} />
      <canvas ref={ref} aria-hidden="true" />
    </div>
  );
}
