// The panel of one step, after the inspector of the Flows prototype: its name, then its
// parameters (text that takes `{{ references }}`, numbers, choices, switches, a schedule, JSON, a
// credential from the vault), its settings (what happens on an error, retries, timeout, disabled,
// its output variable) and the result of a test of the step. Each part is its own block:
// `StepFields` and `StepSettings` go in any panel; `StepInspector` puts them together.

import type { IconDefinition } from "@forgeron/icons";
import {
  Cancel01Icon,
  Copy01Icon,
  Delete02Icon,
  PlayIcon,
  ToggleOffIcon,
  ToggleOnIcon,
} from "@forgeron/icons";
import { useState, type ReactNode } from "react";
import { Button } from "../button";
import { RadioGroup, Switch } from "../controls";
import { cx } from "../cx";
import { Field, Input, Textarea } from "../form";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { Led } from "../led";
import { SelectMenu } from "../overlays";
import { Tabs } from "../tabs";
import { ExpressionInput } from "./automation-expression-input";
import { JsonView } from "./automation-json-view";
import {
  formatDuration,
  statusLook,
  type StepKind,
  type StepStatus,
  type VariableSource,
} from "./automation-model";
import { ScheduleEditor } from "./automation-schedule-editor";

/* ---------------------------------------------------------------- StepFields */

export type StepFieldType =
  | "text"
  | "long"
  | "number"
  | "select"
  | "boolean"
  | "schedule"
  | "json"
  | "credential";

export interface StepFieldSpec {
  key: string;
  label: string;
  type: StepFieldType;
  required?: boolean;
  /** Choices of a `select` or a `credential`. A credential with `missing` is declared but empty. */
  options?: ReadonlyArray<{ value: string; label: string; hint?: string; missing?: boolean }>;
  hint?: ReactNode;
  placeholder?: string;
  /** The type in code, in mono next to the label: `string`, `Credential<"slack">`. */
  typeLabel?: string;
  /** Text fields take `{{ references }}` (default true when `variables` are given). */
  expression?: boolean;
}

export type StepValues = Readonly<Record<string, unknown>>;

export interface StepFieldsProps {
  fields: ReadonlyArray<StepFieldSpec>;
  values?: StepValues;
  defaultValues?: StepValues;
  onChange?: (values: StepValues) => void;
  /** The outputs of the previous steps, for references in text fields. */
  variables?: ReadonlyArray<VariableSource>;
  /** The data of a test run: text fields show what they resolve to. */
  sample?: unknown;
  /** Errors by field key: `Required`. */
  errors?: Readonly<Record<string, ReactNode>>;
  /** The timezone of a schedule field. */
  timezone?: string;
  readOnly?: boolean;
  /** Shown when the step takes no parameter. */
  empty?: ReactNode;
  className?: string;
}

const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));

/** The parameters of a step as a form; text fields take references to earlier steps. */
export function StepFields({
  fields,
  values: valuesProp,
  defaultValues = {},
  onChange,
  variables,
  sample,
  errors,
  timezone,
  readOnly,
  empty = "This step takes no parameter.",
  className,
}: StepFieldsProps) {
  const [values, setValues] = useControllableState<StepValues>({
    value: valuesProp,
    defaultValue: defaultValues,
    onChange,
  });
  const set = (key: string, v: unknown) => setValues({ ...values, [key]: v });
  if (fields.length === 0) return <p className={cx("fg-sfields-empty", className)}>{empty}</p>;
  return (
    <div className={cx("fg-sfields", className)}>
      {fields.map((f) => {
        const v = values[f.key];
        const label = (
          <span className="fg-sfields-label">
            <span>
              {f.label}
              {f.required ? (
                <span className="fg-sfields-req" aria-label="required">
                  {" "}
                  *
                </span>
              ) : null}
            </span>
            {f.typeLabel ? <code className="fg-sfields-type">{f.typeLabel}</code> : null}
          </span>
        );
        if (f.type === "boolean") {
          return (
            <div key={f.key} className="fg-sfields-switch">
              <Switch
                label={f.label}
                checked={Boolean(v)}
                disabled={readOnly}
                onChange={(e) => set(f.key, e.target.checked)}
              />
              {f.hint ? <p className="fg-field-hint">{f.hint}</p> : null}
            </div>
          );
        }
        if (f.type === "schedule") {
          return (
            <div key={f.key} className="fg-sfields-block" role="group" aria-label={f.label}>
              <div className="fg-field-label">{label}</div>
              <ScheduleEditor
                value={str(v) || "0 8 * * 1-5"}
                onChange={(cron) => set(f.key, cron)}
                disabled={readOnly}
                {...(timezone ? { timezone } : {})}
              />
            </div>
          );
        }
        if (f.type === "select" || f.type === "credential") {
          const chosen = f.options?.find((o) => o.value === v);
          return (
            <div key={f.key} className="fg-field">
              <div className="fg-field-label" aria-hidden="true">
                {label}
              </div>
              <SelectMenu
                label={f.label}
                options={(f.options ?? []).map((o) => ({
                  value: o.value,
                  label: o.label,
                  ...(o.missing ? { hint: "no value" } : o.hint ? { hint: o.hint } : {}),
                }))}
                value={str(v) || null}
                onChange={(next) => set(f.key, next)}
                disabled={readOnly}
                {...(f.placeholder ? { placeholder: f.placeholder } : {})}
              />
              {f.type === "credential" && chosen?.missing ? (
                <p className="fg-field-error">
                  {`${chosen.label} is declared in the vault but has no value yet.`}
                </p>
              ) : f.type === "credential" ? (
                <p className="fg-field-hint">From the workspace vault, never shown here.</p>
              ) : null}
              {f.hint ? <p className="fg-field-hint">{f.hint}</p> : null}
              {errors?.[f.key] ? <p className="fg-field-error">{errors[f.key]}</p> : null}
            </div>
          );
        }
        const takesRefs =
          (f.type === "text" || f.type === "long") && variables && f.expression !== false;
        return (
          <Field key={f.key} label={label} hint={f.hint} error={errors?.[f.key]}>
            {(control) =>
              takesRefs ? (
                <ExpressionInput
                  {...control}
                  variables={variables}
                  value={str(v)}
                  onChange={(next) => set(f.key, next)}
                  multiline={f.type === "long"}
                  sample={sample}
                  disabled={readOnly}
                  {...(f.placeholder ? { placeholder: f.placeholder } : {})}
                />
              ) : f.type === "long" || f.type === "json" ? (
                <Textarea
                  {...control}
                  mono={f.type === "json"}
                  rows={f.type === "json" ? 5 : 3}
                  spellCheck={false}
                  value={str(v)}
                  placeholder={f.placeholder}
                  disabled={readOnly}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              ) : (
                <Input
                  {...control}
                  type={f.type === "number" ? "number" : "text"}
                  mono={f.type === "number"}
                  value={str(v)}
                  placeholder={f.placeholder}
                  disabled={readOnly}
                  onChange={(e) =>
                    set(
                      f.key,
                      f.type === "number" && e.target.value !== ""
                        ? Number(e.target.value)
                        : e.target.value,
                    )
                  }
                />
              )
            }
          </Field>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- StepSettings */

export interface StepSettingsValue {
  /** `stop`: the run fails; `continue`: items pass on as if it succeeded; `branch`: an error path. */
  onError: "stop" | "continue" | "branch";
  retry: boolean;
  /** Tries in all, with exponential backoff. */
  attempts: number;
  /** In seconds. */
  timeout: number;
  disabled: boolean;
  /** The name the next steps read its output by: `deal`. */
  output?: string;
  notes?: string;
}

export interface StepSettingsProps {
  value?: StepSettingsValue;
  defaultValue?: StepSettingsValue;
  onChange?: (value: StepSettingsValue) => void;
  readOnly?: boolean;
  className?: string;
}

export const DEFAULT_STEP_SETTINGS: StepSettingsValue = {
  onError: "stop",
  retry: false,
  attempts: 3,
  timeout: 30,
  disabled: false,
};

/** What a step does on an error, its retries, timeout, output name, notes. */
export function StepSettings({
  value,
  defaultValue = DEFAULT_STEP_SETTINGS,
  onChange,
  readOnly,
  className,
}: StepSettingsProps) {
  const [s, setS] = useControllableState<StepSettingsValue>({ value, defaultValue, onChange });
  const set = (patch: Partial<StepSettingsValue>) => setS({ ...s, ...patch });
  return (
    <div className={cx("fg-ssettings", className)}>
      {s.output !== undefined ? (
        <Field
          label="Output variable"
          hint={
            <>
              Next steps read it as <code>{`{{ ${s.output || "name"}.… }}`}</code>
            </>
          }
        >
          {(control) => (
            <Input
              {...control}
              mono
              spellCheck={false}
              value={s.output ?? ""}
              disabled={readOnly}
              onChange={(e) => set({ output: e.target.value.replace(/[^\w$]/g, "") })}
            />
          )}
        </Field>
      ) : null}
      <RadioGroup
        label="On error"
        value={s.onError}
        disabled={readOnly}
        onChange={(v) => set({ onError: v as StepSettingsValue["onError"] })}
        options={[
          { value: "stop", label: "Stop the run", hint: "The run fails and its owner is told." },
          { value: "continue", label: "Continue", hint: "Items pass on as if the step succeeded." },
          {
            value: "branch",
            label: "Take the error path",
            hint: "Adds an error output to handle it.",
          },
        ]}
      />
      <div className="fg-ssettings-row">
        <Switch
          label="Retry on failure"
          checked={s.retry}
          disabled={readOnly}
          onChange={(e) => set({ retry: e.target.checked })}
        />
        {s.retry ? (
          <label className="fg-ssettings-inline">
            <Input
              type="number"
              mono
              min={2}
              max={10}
              value={s.attempts}
              disabled={readOnly}
              onChange={(e) =>
                set({ attempts: Math.max(2, Math.min(10, Number(e.target.value) || 2)) })
              }
            />
            <span>tries, backing off</span>
          </label>
        ) : null}
      </div>
      <label className="fg-ssettings-inline">
        <span className="fg-ssettings-name">Timeout</span>
        <Input
          type="number"
          mono
          min={1}
          value={s.timeout}
          disabled={readOnly}
          onChange={(e) => set({ timeout: Math.max(1, Number(e.target.value) || 1) })}
        />
        <span>seconds</span>
      </label>
      <Switch
        label="Disabled: items pass through unchanged"
        checked={s.disabled}
        disabled={readOnly}
        onChange={(e) => set({ disabled: e.target.checked })}
      />
      <Field label="Notes">
        {(control) => (
          <Textarea
            {...control}
            rows={2}
            placeholder="Why this step is here"
            value={s.notes ?? ""}
            disabled={readOnly}
            onChange={(e) => set({ notes: e.target.value })}
          />
        )}
      </Field>
    </div>
  );
}

/* ---------------------------------------------------------------- StepInspector */

export interface StepTestResult {
  status: StepStatus;
  durationMs?: number;
  items?: number;
  /** `09:42:10`: when the test ran. */
  at?: string;
  input?: unknown;
  output?: unknown;
  error?: { code?: string; message: string };
}

export interface StepInspectorProps {
  icon: IconDefinition;
  kind?: StepKind;
  title: string;
  /** Makes the name editable. */
  onTitleChange?: (title: string) => void;
  /** What it calls, in mono: `Chat · postMessage()`. */
  subtitle?: string;
  onClose?: () => void;
  /** The Parameters tab. */
  fields: ReadonlyArray<StepFieldSpec>;
  values?: StepValues;
  defaultValues?: StepValues;
  onValuesChange?: (values: StepValues) => void;
  variables?: ReadonlyArray<VariableSource>;
  sample?: unknown;
  errors?: Readonly<Record<string, ReactNode>>;
  timezone?: string;
  /** The Settings tab; without it there is none. */
  settings?: StepSettingsValue;
  defaultSettings?: StepSettingsValue;
  onSettingsChange?: (settings: StepSettingsValue) => void;
  /** More tabs after these: the code of the step, its docs. */
  tabs?: ReadonlyArray<{ id: string; label: string; content: ReactNode }>;
  /** The result of the last test, under the parameters. */
  test?: StepTestResult;
  onTest?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  /** With the Settings tab: the switch in the footer that disables the step. */
  readOnly?: boolean;
  className?: string;
}

/** The side panel of a step: name, parameters, settings, more tabs, and its test. */
export function StepInspector({
  icon,
  kind = "action",
  title,
  onTitleChange,
  subtitle,
  onClose,
  fields,
  values,
  defaultValues,
  onValuesChange,
  variables,
  sample,
  errors,
  timezone,
  settings: settingsProp,
  defaultSettings,
  onSettingsChange,
  tabs: more = [],
  test,
  onTest,
  onDuplicate,
  onDelete,
  readOnly,
  className,
}: StepInspectorProps) {
  const hasSettings = settingsProp !== undefined || defaultSettings !== undefined;
  const [settings, setSettings] = useControllableState<StepSettingsValue>({
    value: settingsProp,
    defaultValue: defaultSettings ?? DEFAULT_STEP_SETTINGS,
    onChange: onSettingsChange,
  });
  const tabs = [
    { id: "params", label: "Parameters" },
    ...(hasSettings ? [{ id: "settings", label: "Settings" }] : []),
    ...more.map((t) => ({ id: t.id, label: t.label })),
  ];
  const [tab, setTab] = useState("params");
  const [testSide, setTestSide] = useState<"input" | "output">("output");
  const shownTab = tabs.some((t) => t.id === tab) ? tab : "params";

  let body: ReactNode = null;
  if (shownTab === "params") {
    body = (
      <>
        <StepFields
          fields={fields}
          {...(values ? { values } : {})}
          {...(defaultValues ? { defaultValues } : {})}
          {...(onValuesChange ? { onChange: onValuesChange } : {})}
          {...(variables ? { variables } : {})}
          {...(errors ? { errors } : {})}
          {...(timezone ? { timezone } : {})}
          sample={sample}
          readOnly={readOnly}
        />
        {variables && kind !== "trigger" && !readOnly ? (
          <p className="fg-insp-tip">
            Type <code>{"{{"}</code> in a field to use what an earlier step gave.
          </p>
        ) : null}
        {test ? (
          <div className="fg-insp-test">
            <div className="fg-insp-test-head">
              <Led tone={statusLook(test.status).tone} />
              <span>
                {test.status === "error"
                  ? `Error · ${formatDuration(test.durationMs)}`
                  : test.status === "skipped"
                    ? "Not reached with the test data"
                    : [
                        statusLook(test.status).word,
                        formatDuration(test.durationMs),
                        test.items !== undefined
                          ? `${test.items} item${test.items === 1 ? "" : "s"}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
              </span>
              {test.at ? <span className="fg-insp-test-at">{test.at}</span> : null}
            </div>
            {test.status !== "skipped" ? (
              <div className="fg-insp-test-tabs" role="group" aria-label="Test data">
                {(["input", "output"] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    aria-pressed={testSide === side}
                    onClick={() => setTestSide(side)}
                  >
                    {side === "input" ? "Input" : "Output"}
                  </button>
                ))}
              </div>
            ) : null}
            {test.error && testSide === "output" ? (
              <div className="fg-insp-test-error" role="alert">
                {test.error.code ? <code>{test.error.code}</code> : null} {test.error.message}
              </div>
            ) : test.status !== "skipped" ? (
              <JsonView
                className="fg-insp-test-json"
                value={testSide === "input" ? test.input : test.output}
                maxHeight={220}
              />
            ) : null}
          </div>
        ) : null}
      </>
    );
  } else if (shownTab === "settings") {
    body = <StepSettings value={settings} onChange={setSettings} readOnly={readOnly} />;
  } else {
    body = more.find((t) => t.id === shownTab)?.content ?? null;
  }

  return (
    <aside className={cx("fg-insp", `fg-insp-${kind}`, className)} aria-label={`Step: ${title}`}>
      <header className="fg-insp-head">
        <span className="fg-step-tile">
          <Icon icon={icon} size={12} variant={kind === "trigger" ? "mono" : "duo"} />
        </span>
        <span className="fg-insp-names">
          {onTitleChange && !readOnly ? (
            <input
              className="fg-insp-title-input"
              aria-label="Step name"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          ) : (
            <span className="fg-insp-title">{title}</span>
          )}
          {subtitle ? <span className="fg-insp-sub">{subtitle}</span> : null}
        </span>
        {onClose ? (
          <IconButton icon={Cancel01Icon} label="Close" size="sm" onClick={onClose} />
        ) : null}
      </header>
      <Tabs className="fg-insp-tabs" label="Step" tabs={tabs} value={shownTab} onChange={setTab}>
        <div className="fg-insp-body">{body}</div>
      </Tabs>
      {readOnly || !(onTest || onDuplicate || onDelete || hasSettings) ? null : (
        <footer className="fg-insp-foot">
          {onTest ? (
            <Button size="sm" onClick={onTest}>
              <Icon icon={PlayIcon} size={12} variant="mono" />
              Test step
            </Button>
          ) : null}
          <span className="fg-insp-sp" />
          {onDuplicate ? (
            <IconButton icon={Copy01Icon} label="Duplicate" size="sm" onClick={onDuplicate} />
          ) : null}
          {hasSettings ? (
            <IconButton
              icon={settings.disabled ? ToggleOffIcon : ToggleOnIcon}
              label={settings.disabled ? "Enable the step" : "Disable the step"}
              size="sm"
              onClick={() => setSettings({ ...settings, disabled: !settings.disabled })}
            />
          ) : null}
          {onDelete ? (
            <IconButton icon={Delete02Icon} label="Delete the step" size="sm" onClick={onDelete} />
          ) : null}
        </footer>
      )}
    </aside>
  );
}
