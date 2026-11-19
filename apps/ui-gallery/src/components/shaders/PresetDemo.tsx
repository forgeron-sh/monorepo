import { builtInPresets, type ParamSpec, PASSES, type Preset } from "@forgeron/shaders";
import { mountPreset } from "@forgeron/shaders/dom";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * A built-in preset of @forgeron/shaders (`builtInPresets()`) on a canvas, through `mountPreset`
 * (GPU when every step has GLSL, CPU otherwise). `pass` is the step the page is about; `params`
 * override its settings; `live` draws a control per setting from the pass's params schema, so the
 * page edits the preset as the editor will.
 */
export interface PresetDemoProps {
  name: string;
  pass: string;
  params?: Record<string, unknown>;
  live?: boolean;
}

type Values = Record<string, unknown>;

const withParams = (preset: Preset, pass: string, values: Values): Preset => ({
  ...preset,
  passes: preset.passes.map((step) => (step.type === pass ? { ...step, ...values } : step)),
});

export default function PresetDemo({ name, pass, params, live }: PresetDemoProps) {
  const base = useMemo(() => builtInPresets()[name], [name]);
  const step = base?.passes.find((s) => s.type === pass);
  const [values, setValues] = useState<Values>(() => ({ ...step, ...params }));
  const ref = useRef<HTMLCanvasElement>(null);
  const [side, setSide] = useState("");
  const [problem, setProblem] = useState("");
  const key = JSON.stringify(values);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !base) return;
    try {
      const handle = mountPreset(canvas, withParams(base, pass, JSON.parse(key) as Values));
      setSide(handle?.side ?? "unavailable");
      setProblem("");
      return () => handle?.destroy();
    } catch (e) {
      setProblem(e instanceof Error ? e.message : String(e));
      return undefined;
    }
  }, [base, pass, key]);

  const schema = PASSES[pass]?.params ?? {};
  return (
    <div className="sh-preset">
      {/* A fresh canvas per preset (`key`): a canvas keeps the context kind it was first given. */}
      <canvas key={key} ref={ref} className="fg-shader" aria-hidden="true" />
      {live ? (
        <form className="sh-controls t-mono" onSubmit={(e) => e.preventDefault()}>
          <span className="dim">
            {pass} · {side === "gpu" ? "GPU" : side === "cpu" ? "CPU" : side}
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
