// The panel of one step, after the inspector of the Flows prototype: its name, then its
// parameters (text that takes `{{ references }}`, numbers, choices, switches, a schedule, JSON, a
// credential from the vault), its settings (what happens on an error, retries, timeout, disabled,
// its output variable) and the result of a test of the step. Each part is its own block:
// `StepFields` and `StepSettings` go in any panel; `StepInspector` puts them together.
//
// All three draw themselves; given children they are the parts:
//
//   <StepFields fields={fields} values={values} onChange={setValues}>
//     <StepField field={fields[0]!} />
//   </StepFields>
//
//   <StepSettings value={s} onChange={setS}>
//     <StepSettingsOnError />
//     <StepSettingsRetry />
//   </StepSettings>
//
//   <StepInspector icon={BoltIcon} title="Send invoice" fields={fields} onClose={close}>
//     <StepInspectorHeader />
//     <StepInspectorTabs />
//     <StepInspectorFooter />
//   </StepInspector>

import type { IconDefinition } from "@forgeron/icons";
import {
  Cancel01Icon,
  Copy01Icon,
  Delete02Icon,
  PlayIcon,
  ToggleOffIcon,
  ToggleOnIcon,
} from "@forgeron/icons";
import { createContext, useContext, useState, type ComponentProps, type ReactNode } from "react";
import { Button } from "../button";
import { RadioGroup, Switch } from "../controls";
import { cx } from "../cx";
import { ExpressionInput } from "../expression-input";
import { Field, Input, Textarea } from "../form";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { JsonView } from "../json-view";
import { Led } from "../led";
import { SelectMenu } from "../overlays";
import { renderPart } from "../part";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";
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

interface StepFieldsContext {
  values: StepValues;
  set: (key: string, value: unknown) => void;
  variables: ReadonlyArray<VariableSource> | undefined;
  sample: unknown;
  errors: Readonly<Record<string, ReactNode>> | undefined;
  timezone: string | undefined;
  readOnly: boolean | undefined;
}

const FieldsCtx = createContext<StepFieldsContext | null>(null);

/** The form a `StepField` is in: the values and how to change one. */
export function useStepFields(part = "useStepFields"): StepFieldsContext {
  const ctx = useContext(FieldsCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <StepFields>.`);
  return ctx;
}

export interface StepFieldsProps extends Omit<
  ComponentProps<"div">,
  "className" | "onChange" | "children"
> {
  /** The fields to draw. Without them (and with children) the parts are yours. */
  fields?: ReadonlyArray<StepFieldSpec>;
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
  asChild?: boolean;
  /** The parts: `StepField`s. */
  children?: ReactNode;
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
  asChild,
  children,
  ...rest
}: StepFieldsProps) {
  const [values, setValues] = useControllableState<StepValues>({
    value: valuesProp,
    defaultValue: defaultValues,
    onChange,
  });
  const ctx: StepFieldsContext = {
    values,
    set: (key, v) => setValues({ ...values, [key]: v }),
    variables,
    sample,
    errors,
    timezone,
    readOnly,
  };
  if (fields && fields.length === 0 && children === undefined) {
    return (
      <p data-slot="step-fields-empty" className={cx("fg-sfields-empty", className)}>
        {empty}
      </p>
    );
  }
  return (
    <FieldsCtx.Provider value={ctx}>
      {renderPart("div", cx("fg-sfields", className), asChild, {
        "data-slot": "step-fields",
        ...rest,
        children: children ?? fields?.map((f) => <StepField key={f.key} field={f} />),
      })}
    </FieldsCtx.Provider>
  );
}

export interface StepFieldProps extends Omit<ComponentProps<"div">, "children"> {
  field: StepFieldSpec;
}

/** One parameter: the control its `type` asks for, with its label, hint and error. */
export function StepField({ field: f, className, ...rest }: StepFieldProps) {
  const { values, set, variables, sample, errors, timezone, readOnly } = useStepFields("StepField");
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
      <div data-slot="step-field" {...rest} className={cx("fg-sfields-switch", className)}>
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
      <div
        data-slot="step-field"
        role="group"
        aria-label={f.label}
        {...rest}
        className={cx("fg-sfields-block", className)}
      >
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
      <div data-slot="step-field" {...rest} className={cx("fg-field", className)}>
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
  const takesRefs = (f.type === "text" || f.type === "long") && variables && f.expression !== false;
  return (
    <Field
      data-slot="step-field"
      {...rest}
      className={className}
      label={label}
      hint={f.hint}
      error={errors?.[f.key]}
    >
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

export const DEFAULT_STEP_SETTINGS: StepSettingsValue = {
  onError: "stop",
  retry: false,
  attempts: 3,
  timeout: 30,
  disabled: false,
};

interface StepSettingsContext {
  value: StepSettingsValue;
  set: (patch: Partial<StepSettingsValue>) => void;
  readOnly: boolean | undefined;
}

const SettingsCtx = createContext<StepSettingsContext | null>(null);

/** The settings a part is in: the value and how to patch it. */
export function useStepSettings(part = "useStepSettings"): StepSettingsContext {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <StepSettings>.`);
  return ctx;
}

export interface StepSettingsProps extends Omit<
  ComponentProps<"div">,
  "className" | "onChange" | "defaultValue"
> {
  value?: StepSettingsValue;
  defaultValue?: StepSettingsValue;
  onChange?: (value: StepSettingsValue) => void;
  readOnly?: boolean;
  className?: string;
  asChild?: boolean;
  /** The parts. Without them: every setting. */
  children?: ReactNode;
}

/** What a step does on an error, its retries, timeout, output name, notes. */
export function StepSettings({
  value,
  defaultValue = DEFAULT_STEP_SETTINGS,
  onChange,
  readOnly,
  className,
  asChild,
  children,
  ...rest
}: StepSettingsProps) {
  const [s, setS] = useControllableState<StepSettingsValue>({ value, defaultValue, onChange });
  const ctx: StepSettingsContext = {
    value: s,
    set: (patch) => setS({ ...s, ...patch }),
    readOnly,
  };
  return (
    <SettingsCtx.Provider value={ctx}>
      {renderPart("div", cx("fg-ssettings", className), asChild, {
        "data-slot": "step-settings",
        ...rest,
        children: children ?? (
          <>
            <StepSettingsOutput />
            <StepSettingsOnError />
            <StepSettingsRetry />
            <StepSettingsTimeout />
            <StepSettingsDisabled />
            <StepSettingsNotes />
          </>
        ),
      })}
    </SettingsCtx.Provider>
  );
}

/** The name the next steps read the output by. Nothing while the value has no `output`. */
export function StepSettingsOutput({ className }: { className?: string }) {
  const { value: s, set, readOnly } = useStepSettings("StepSettingsOutput");
  if (s.output === undefined) return null;
  return (
    <Field
      data-slot="step-settings-output"
      className={className}
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
  );
}

/** What happens when the step fails. */
export function StepSettingsOnError({ className }: { className?: string }) {
  const { value: s, set, readOnly } = useStepSettings("StepSettingsOnError");
  return (
    <RadioGroup
      data-slot="step-settings-on-error"
      className={className}
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
  );
}

/** The retry switch and, when it is on, how many tries. */
export function StepSettingsRetry({ className, ...rest }: ComponentProps<"div">) {
  const { value: s, set, readOnly } = useStepSettings("StepSettingsRetry");
  return (
    <div data-slot="step-settings-retry" {...rest} className={cx("fg-ssettings-row", className)}>
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
  );
}

/** How long the step may take, in seconds. */
export function StepSettingsTimeout({ className, ...rest }: ComponentProps<"label">) {
  const { value: s, set, readOnly } = useStepSettings("StepSettingsTimeout");
  return (
    <label
      data-slot="step-settings-timeout"
      {...rest}
      className={cx("fg-ssettings-inline", className)}
    >
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
  );
}

/** The switch that lets items pass through unchanged. */
export function StepSettingsDisabled({ className }: { className?: string }) {
  const { value: s, set, readOnly } = useStepSettings("StepSettingsDisabled");
  return (
    <Switch
      data-slot="step-settings-disabled"
      className={className}
      label="Disabled: items pass through unchanged"
      checked={s.disabled}
      disabled={readOnly}
      onChange={(e) => set({ disabled: e.target.checked })}
    />
  );
}

/** Why the step is here. */
export function StepSettingsNotes({ className }: { className?: string }) {
  const { value: s, set, readOnly } = useStepSettings("StepSettingsNotes");
  return (
    <Field data-slot="step-settings-notes" className={className} label="Notes">
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

interface InspectorTab {
  id: string;
  label: string;
}

interface StepInspectorContext {
  icon: IconDefinition;
  kind: StepKind;
  title: string;
  subtitle: string | undefined;
  onTitleChange: ((title: string) => void) | undefined;
  onClose: (() => void) | undefined;
  readOnly: boolean | undefined;
  /** The Parameters tab, as the props of its `StepFields`. */
  fieldsProps: StepFieldsProps;
  hasSettings: boolean;
  settings: StepSettingsValue;
  setSettings: (settings: StepSettingsValue) => void;
  /** Parameters, Settings if there are settings, and the tabs the caller adds. */
  tabs: ReadonlyArray<InspectorTab>;
  more: ReadonlyArray<{ id: string; label: string; content: ReactNode }>;
  tab: string;
  setTab: (id: string) => void;
  test: StepTestResult | undefined;
  onTest: (() => void) | undefined;
  onDuplicate: (() => void) | undefined;
  onDelete: (() => void) | undefined;
  /** Shows the tip about `{{` under the parameters. */
  tip: boolean;
}

const InspectorCtx = createContext<StepInspectorContext | null>(null);

/** The inspector a part is in: its step, its tabs, its settings and its test. */
export function useStepInspector(part = "useStepInspector"): StepInspectorContext {
  const ctx = useContext(InspectorCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <StepInspector>.`);
  return ctx;
}

export interface StepInspectorProps extends Omit<
  ComponentProps<"aside">,
  "className" | "title" | "children"
> {
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
  asChild?: boolean;
  /** The parts. Without them: the header, the tabs and the footer. */
  children?: ReactNode;
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
  asChild,
  children,
  ...rest
}: StepInspectorProps) {
  const hasSettings = settingsProp !== undefined || defaultSettings !== undefined;
  const [settings, setSettings] = useControllableState<StepSettingsValue>({
    value: settingsProp,
    defaultValue: defaultSettings ?? DEFAULT_STEP_SETTINGS,
    onChange: onSettingsChange,
  });
  const tabs: InspectorTab[] = [
    { id: "params", label: "Parameters" },
    ...(hasSettings ? [{ id: "settings", label: "Settings" }] : []),
    ...more.map((t) => ({ id: t.id, label: t.label })),
  ];
  const [tab, setTab] = useState("params");
  const ctx: StepInspectorContext = {
    icon,
    kind,
    title,
    subtitle,
    onTitleChange,
    onClose,
    readOnly,
    fieldsProps: {
      fields,
      ...(values ? { values } : {}),
      ...(defaultValues ? { defaultValues } : {}),
      ...(onValuesChange ? { onChange: onValuesChange } : {}),
      ...(variables ? { variables } : {}),
      ...(errors ? { errors } : {}),
      ...(timezone ? { timezone } : {}),
      sample,
      readOnly,
    },
    hasSettings,
    settings,
    setSettings,
    tabs,
    more,
    tab: tabs.some((t) => t.id === tab) ? tab : "params",
    setTab,
    test,
    onTest,
    onDuplicate,
    onDelete,
    tip: Boolean(variables) && kind !== "trigger" && !readOnly,
  };
  return (
    <InspectorCtx.Provider value={ctx}>
      {renderPart("aside", cx("fg-insp", `fg-insp-${kind}`, className), asChild, {
        "data-slot": "step-inspector",
        "aria-label": `Step: ${title}`,
        ...rest,
        children: children ?? (
          <>
            <StepInspectorHeader />
            <StepInspectorTabs />
            <StepInspectorFooter />
          </>
        ),
      })}
    </InspectorCtx.Provider>
  );
}

/* ---------------------------------------------------------------- parts */

/** Its tile, its name (a field when it can be renamed), what it calls, and a close button. */
export function StepInspectorHeader({ className, children, ...rest }: ComponentProps<"header">) {
  const { icon, kind, title, subtitle, onTitleChange, onClose, readOnly } =
    useStepInspector("StepInspectorHeader");
  return (
    <header data-slot="step-inspector-header" {...rest} className={cx("fg-insp-head", className)}>
      {children ?? (
        <>
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
        </>
      )}
    </header>
  );
}

/** The tabs and their panels: Parameters, Settings and the caller's. */
export function StepInspectorTabs({ className, children, ...rest }: ComponentProps<typeof Tabs>) {
  const { tabs, tab, setTab, more, settings, setSettings, readOnly } =
    useStepInspector("StepInspectorTabs");
  return (
    <Tabs
      data-slot="step-inspector-tabs"
      {...(rest as object)}
      className={cx("fg-insp-tabs", className)}
      value={tab}
      onValueChange={(next: unknown) => setTab(String(next))}
    >
      {children ?? (
        <>
          <TabsList aria-label="Step">
            {tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="params">
            <div className="fg-insp-body">
              <StepInspectorParams />
            </div>
          </TabsContent>
          {tabs.some((t) => t.id === "settings") ? (
            <TabsContent value="settings">
              <div className="fg-insp-body">
                <StepSettings value={settings} onChange={setSettings} readOnly={readOnly} />
              </div>
            </TabsContent>
          ) : null}
          {more.map((t) => (
            <TabsContent key={t.id} value={t.id}>
              <div className="fg-insp-body">{t.content}</div>
            </TabsContent>
          ))}
        </>
      )}
    </Tabs>
  );
}

/** The parameters, the tip about references and the result of the test. */
export function StepInspectorParams({ children }: { children?: ReactNode }) {
  const { fieldsProps } = useStepInspector("StepInspectorParams");
  return (
    <>
      <StepFields {...fieldsProps} />
      {children ?? (
        <>
          <StepInspectorTip />
          <StepInspectorTest />
        </>
      )}
    </>
  );
}

/** `Type {{ in a field…`: shown when there are variables, for a step that is not a trigger. */
export function StepInspectorTip({ className, children, ...rest }: ComponentProps<"p">) {
  const { tip } = useStepInspector("StepInspectorTip");
  if (!tip) return null;
  return (
    <p data-slot="step-inspector-tip" {...rest} className={cx("fg-insp-tip", className)}>
      {children ?? (
        <>
          Type <code>{"{{"}</code> in a field to use what an earlier step gave.
        </>
      )}
    </p>
  );
}

/** The result of the last test: its state, its input and output, its error. */
export function StepInspectorTest({ className, ...rest }: Omit<ComponentProps<"div">, "children">) {
  const { test } = useStepInspector("StepInspectorTest");
  const [side, setSide] = useState<"input" | "output">("output");
  if (!test) return null;
  return (
    <div data-slot="step-inspector-test" {...rest} className={cx("fg-insp-test", className)}>
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
          {(["input", "output"] as const).map((s) => (
            <button key={s} type="button" aria-pressed={side === s} onClick={() => setSide(s)}>
              {s === "input" ? "Input" : "Output"}
            </button>
          ))}
        </div>
      ) : null}
      {test.error && side === "output" ? (
        <div className="fg-insp-test-error" role="alert">
          {test.error.code ? <code>{test.error.code}</code> : null} {test.error.message}
        </div>
      ) : test.status !== "skipped" ? (
        <JsonView
          className="fg-insp-test-json"
          value={side === "input" ? test.input : test.output}
          maxHeight={220}
        />
      ) : null}
    </div>
  );
}

/** Test, duplicate, disable and delete. Nothing when the step is read-only or none applies. */
export function StepInspectorFooter({ className, children, ...rest }: ComponentProps<"footer">) {
  const { readOnly, onTest, onDuplicate, onDelete, hasSettings, settings, setSettings } =
    useStepInspector("StepInspectorFooter");
  if (readOnly || !(children || onTest || onDuplicate || onDelete || hasSettings)) return null;
  return (
    <footer data-slot="step-inspector-footer" {...rest} className={cx("fg-insp-foot", className)}>
      {children ?? (
        <>
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
        </>
      )}
    </footer>
  );
}
