import { type ParamSpec, PASSES, type Preset, SOURCES } from "@forgeron/shaders";
import { mountPreset } from "@forgeron/shaders/dom";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import type { StepRef } from "../../lib/shaders";

/**
 * A preset of @forgeron/shaders on a canvas, through `mountPreset` (GPU when every step has GLSL,
 * CPU otherwise). With `live`, a control per setting of the step `edit` names, drawn from its
 * params schema: the page edits the preset as the editor will. `under` is a preset drawn beneath
 * (what shows through the transparent tones); `faint` draws it as forgeron.sh's hero does.
 */
export interface PresetDemoProps {
  preset: Preset;
  edit?: StepRef;
  live?: boolean;
  under?: Preset;
  faint?: boolean;
}

type Values = Record<string, unknown>;

const stepOf = (preset: Preset, ref: StepRef) =>
  ref.on === "source" ? preset.source : preset.passes.find((s) => s.type === ref.type);

const withValues = (preset: Preset, ref: StepRef, values: Values): Preset => {
  if (ref.on === "source") return { ...preset, source: { ...preset.source, ...values } };
  const at = preset.passes.findIndex((s) => s.type === ref.type);
  return { ...preset, passes: preset.passes.map((s, i) => (i === at ? { ...s, ...values } : s)) };
};

type Report = (side: string, problem: string) => void;

/**
 * One preset on its own canvas, given as JSON so that an equal preset keeps its mount. Keyed by
 * that JSON where it is used: a canvas keeps the context kind it was first given.
 */
function PresetCanvas({
  json,
  report,
  className,
  style,
}: {
  json: string;
  report?: Report;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    try {
      const handle = mountPreset(canvas, JSON.parse(json) as Preset);
      report?.(handle?.side ?? "unavailable", "");
      return () => handle?.destroy();
    } catch (e) {
      report?.("", e instanceof Error ? e.message : String(e));
      return undefined;
    }
  }, [json, report]);
  return <canvas ref={ref} className={className} style={style} aria-hidden="true" />;
}

export default function PresetDemo({ preset, edit, live, under, faint }: PresetDemoProps) {
  const [values, setValues] = useState<Values>(() => ({ ...(edit ? stepOf(preset, edit) : {}) }));
  const [side, setSide] = useState("");
  const [problem, setProblem] = useState("");
  const report = useCallback<Report>((s, p) => {
    setSide(s);
    setProblem(p);
  }, []);
  const top = JSON.stringify(edit ? withValues(preset, edit, values) : preset);
  const below = under ? JSON.stringify(under) : null;
  const schema = edit ? ((edit.on === "source" ? SOURCES : PASSES)[edit.type]?.params ?? {}) : {};

  return (
    <div className="sh-preset">
      {below ? <PresetCanvas key={below} json={below} /> : null}
      <PresetCanvas
        key={top}
        json={top}
        report={report}
        className="fg-shader"
        style={faint ? { opacity: 0.06, mixBlendMode: "screen" } : undefined}
      />
      {live && edit ? (
        <form className="sh-controls t-mono" onSubmit={(e) => e.preventDefault()}>
          <span className="dim">
            {edit.type} {edit.on} · {side === "gpu" ? "GPU" : side === "cpu" ? "CPU" : side}
          </span>
          {Object.entries(schema).map(([param, spec]) => (
            <Control
              key={param}
              name={param}
              spec={spec}
              value={values[param]}
              onChange={(v) => setValues((old) => ({ ...old, [param]: v }))}
            />
          ))}
          {Object.keys(schema).length === 0 ? <span className="dim">no settings</span> : null}
          {problem ? <span className="sh-problem">{problem}</span> : null}
        </form>
      ) : null}
    </div>
  );
}

/** One setting, drawn from its schema: a slider, a list, a box, or text for lists of numbers. */
function Control({
  name,
  spec,
  value,
  onChange,
}: {
  name: string;
  spec: ParamSpec;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const label = <span>{name}</span>;
  switch (spec.type) {
    case "number": {
      const min = spec.min ?? 0;
      const max = spec.max ?? Math.max(1, spec.default * 4);
      const step = spec.integer ? 1 : (max - min) / 100;
      return (
        <label>
          {label}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={Number(value ?? spec.default)}
            onChange={(e) => onChange(Number(e.currentTarget.value))}
          />
          <output>{Number(value ?? spec.default).toFixed(spec.integer ? 0 : 2)}</output>
        </label>
      );
    }
    case "boolean":
      return (
        <label>
          {label}
          <input
            type="checkbox"
            checked={Boolean(value ?? spec.default)}
            onChange={(e) => onChange(e.currentTarget.checked)}
          />
        </label>
      );
    case "enum":
      return (
        <label>
          {label}
          <select
            value={String(value ?? spec.default)}
            onChange={(e) => {
              const raw = e.currentTarget.value;
              onChange(spec.values.find((v) => String(v) === raw) ?? raw);
            }}
          >
            {spec.values.map((v) => (
              <option key={String(v)} value={String(v)}>
                {String(v)}
              </option>
            ))}
          </select>
        </label>
      );
    case "indices":
    case "steps":
      return (
        <label>
          {label}
          <input
            type="text"
            defaultValue={JSON.stringify(value ?? spec.default)}
            onBlur={(e) => {
              try {
                onChange(JSON.parse(e.currentTarget.value));
              } catch {
                // Not JSON yet: the field keeps what was typed, the preset its last value.
              }
            }}
          />
        </label>
      );
    default:
      return null;
  }
}
