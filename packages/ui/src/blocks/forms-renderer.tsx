// A form schema as the form a respondent fills in: every type of question, sections as pages with
// a progress bar, questions that appear and disappear with the answers, the problems said under
// each question, a review step, and typed answers handed to `onSubmit`. FormQuestionField is the
// control of one question, usable on its own.

import type { ComponentProps, FormEvent, HTMLAttributes, ReactNode } from "react";
import { createElement, useEffect, useId, useRef, useState, type RefObject } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { Checkbox, Input, Textarea } from "../form";
import { useControllableState } from "../hooks/use-controllable";
import { FileInput } from "../file-input";
import { Progress } from "../marks";
import { NumberInput } from "../numbers";
import { DatePicker, SelectMenu } from "../overlays";
import { Rating, Scale } from "../rating";
import { TimePicker } from "../time";
import { SignaturePad, type SignatureValue } from "../signature-pad";
import { AddressField, type AddressPart } from "../address-field";
import { MatrixField, RankingField } from "./forms-fields";
import { partContext } from "../part";
import {
  cleanFormAnswers,
  formAnswerText,
  formPages,
  isFormAnswerEmpty,
  validateFormAnswers,
  type FormAddress,
  type FormAnswer,
  type FormAnswers,
  type FormFileAnswer,
  type FormMatrixAnswer,
  type FormPage,
  type FormQuestion,
  type FormSchema,
} from "./forms-model";

/* ---------------------------------------------------------------- One question */

export interface FormQuestionFieldProps extends Omit<
  ComponentProps<"div">,
  "ref" | "onChange" | "defaultValue" | "children" | "onBlur"
> {
  question: FormQuestion;
  /** The answer. Controlled or not. */
  value?: FormAnswer | undefined;
  defaultValue?: FormAnswer | undefined;
  onChange?: (answer: FormAnswer) => void;
  /** What is wrong with the answer, said under the control. */
  error?: string | null | undefined;
  /** Countries to choose from for an address; absent, the country is typed. */
  countries?: ReadonlyArray<{ value: string; label: string }>;
  disabled?: boolean;
  /** Hides the title, help and error of the default composition: the control alone. */
  bare?: boolean;
  /** Called when focus leaves the question: the moment to show its error. */
  onBlur?: () => void;
  /** The parts: `FormQuestionFieldTitle`, `FormQuestionFieldHelp`, `FormQuestionFieldControl`, `FormQuestionFieldError`. */
  children?: ReactNode;
}

interface FormQuestionContext {
  q: FormQuestion;
  titleId: string;
  helpId: string;
  errorId: string;
  controlId: string;
  error: string | null | undefined;
  /** The control is an input the title labels with `for`. */
  textual: boolean;
  control: () => ReactNode;
}

const [FormQuestionCtx, useFormQuestionField] =
  partContext<FormQuestionContext>("FormQuestionField");

/** The state of the enclosing `FormQuestionField`: its question, its ids and its error. */
export { useFormQuestionField };

const INPUT_TYPES = new Set(["shortText", "longText"]);

/** The title, the help, the control and the error of one question, tied together for assistive technology. */
export function FormQuestionField({
  question: q,
  value,
  defaultValue,
  onChange,
  error,
  countries,
  disabled,
  bare,
  onBlur,
  children,
  className,
  ...rest
}: FormQuestionFieldProps) {
  const [answer, setAnswer] = useControllableState<FormAnswer | undefined>({
    value,
    defaultValue: defaultValue ?? null,
    onChange: onChange ? (next) => onChange(next ?? null) : undefined,
  });
  const uid = useId();
  const titleId = `${uid}-t`;
  const helpId = `${uid}-h`;
  const errorId = `${uid}-e`;
  const controlId = `${uid}-c`;
  const describedBy =
    [q.help ? helpId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;
  const invalid = error ? true : undefined;
  const required = q.required ? true : undefined;
  const title = q.title.trim() || "Untitled question";
  const v = q.validation ?? {};
  const set = (next: FormAnswer) => setAnswer(next);
  const text = typeof answer === "string" ? answer : "";
  const list =
    Array.isArray(answer) && !(answer as unknown[]).some((x) => typeof x === "object")
      ? (answer as string[])
      : [];

  const control = (): ReactNode => {
    switch (q.type) {
      case "shortText":
        return (
          <Input
            id={controlId}
            type={v.format === "email" ? "email" : v.format === "url" ? "url" : "text"}
            autoComplete={v.format === "email" ? "email" : "off"}
            value={text}
            placeholder={q.placeholder}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            aria-required={required}
            disabled={disabled}
            onChange={(event) => set(event.target.value)}
          />
        );
      case "longText":
        return (
          <Textarea
            id={controlId}
            rows={4}
            value={text}
            placeholder={q.placeholder}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            aria-required={required}
            disabled={disabled}
            onChange={(event) => set(event.target.value)}
          />
        );
      case "singleChoice":
        return (
          <div
            role="radiogroup"
            aria-labelledby={titleId}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            aria-required={required}
            className="fg-radios-list"
          >
            {(q.options ?? []).map((o) => (
              <label key={o.id} className="fg-radio">
                <input
                  type="radio"
                  className="fg-radio-input"
                  name={uid}
                  value={o.id}
                  checked={answer === o.id}
                  disabled={disabled}
                  onChange={() => set(o.id)}
                />
                <span className="fg-radio-text">
                  <span>{o.label}</span>
                </span>
              </label>
            ))}
          </div>
        );
      case "multiChoice":
        return (
          <div
            role="group"
            aria-labelledby={titleId}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className="fg-fm-checks"
          >
            {(q.options ?? []).map((o) => (
              <Checkbox
                key={o.id}
                label={o.label}
                checked={list.includes(o.id)}
                disabled={disabled}
                onChange={(event) =>
                  set(event.target.checked ? [...list, o.id] : list.filter((id) => id !== o.id))
                }
              />
            ))}
          </div>
        );
      case "dropdown":
        return (
          <SelectMenu
            label={title}
            options={(q.options ?? []).map((o) => ({ value: o.id, label: o.label }))}
            value={typeof answer === "string" ? answer : null}
            placeholder="Choose an option"
            onChange={(next) => set(next)}
            disabled={disabled}
            className="fg-fm-select"
          />
        );
      case "number":
        return (
          <NumberInput
            id={controlId}
            label={title}
            value={typeof answer === "number" ? answer : null}
            onChange={(next) => set(next)}
            {...(q.placeholder ? { placeholder: q.placeholder } : {})}
            {...(v.integer ? { step: 1 } : {})}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            disabled={disabled}
          />
        );
      case "date":
        return (
          <DatePicker
            label={title}
            variant="field"
            presets={[]}
            clearable={!q.required}
            placeholder="YYYY-MM-DD"
            value={typeof answer === "string" ? answer : null}
            onChange={(next) => set(next)}
          />
        );
      case "time":
        return (
          <TimePicker
            id={controlId}
            label={title}
            value={typeof answer === "string" ? answer : null}
            onChange={(next) => set(next)}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            disabled={disabled}
          />
        );
      case "rating":
        return (
          <Rating
            label={title}
            max={q.range?.max ?? 5}
            value={typeof answer === "number" ? answer : null}
            onChange={(next) => set(next)}
            clearable={!q.required}
            disabled={disabled}
          />
        );
      case "scale":
        return (
          <Scale
            label={title}
            min={q.range?.min ?? 1}
            max={q.range?.max ?? 5}
            {...(q.range?.lowLabel ? { lowLabel: q.range.lowLabel } : {})}
            {...(q.range?.highLabel ? { highLabel: q.range.highLabel } : {})}
            {...(q.range?.nps ? { nps: true } : {})}
            value={typeof answer === "number" ? answer : null}
            onChange={(next) => set(next)}
            disabled={disabled}
          />
        );
      case "matrix":
        return (
          <MatrixField
            label={title}
            rows={q.options ?? []}
            columns={q.columns ?? []}
            multiple={q.multiple === true}
            value={
              answer && typeof answer === "object" && !Array.isArray(answer)
                ? (answer as FormMatrixAnswer)
                : {}
            }
            onChange={(next) => set(next)}
            invalid={Boolean(error)}
            {...(describedBy ? { describedBy } : {})}
            disabled={disabled}
          />
        );
      case "ranking":
        return (
          <RankingField
            label={title}
            items={q.options ?? []}
            value={Array.isArray(answer) ? (answer as string[]) : null}
            onChange={(next) => set(next)}
            invalid={Boolean(error)}
            {...(describedBy ? { describedBy } : {})}
            disabled={disabled}
          />
        );
      case "address":
        return (
          <AddressField
            label={title}
            value={
              answer && typeof answer === "object" && !Array.isArray(answer)
                ? (answer as FormAddress)
                : {}
            }
            onChange={(next) => set(next)}
            required={q.required === true}
            {...(countries ? { countries } : {})}
            {...(error ? { errors: addressErrors(q, answer, error) } : {})}
            {...(describedBy ? { describedBy } : {})}
            disabled={disabled}
          />
        );
      case "file": {
        const files = Array.isArray(answer) ? (answer as FormFileAnswer[]) : [];
        return (
          <FileInput
            id={controlId}
            label={title}
            value={files.flatMap((f) => (f.file ? [f.file] : []))}
            onChange={(next) =>
              set(
                next.length
                  ? next.map((file) => ({
                      name: file.name,
                      size: file.size,
                      type: file.type,
                      file,
                    }))
                  : null,
              )
            }
            {...(v.accept ? { accept: v.accept } : {})}
            multiple={v.maxFiles !== 1}
            {...(v.maxSizeMb ? { maxSize: v.maxSizeMb * 1_000_000 } : {})}
            {...(v.maxFiles ? { maxFiles: v.maxFiles } : {})}
            disabled={disabled}
          />
        );
      }
      case "signature":
        return (
          <SignaturePad
            label={title}
            value={
              answer && typeof answer === "object" && !Array.isArray(answer) && "dataUrl" in answer
                ? (answer as SignatureValue)
                : null
            }
            onChange={(next) => set(next as FormAnswer)}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <FormQuestionCtx.Provider
      value={{
        q,
        titleId,
        helpId,
        errorId,
        controlId,
        error,
        textual: INPUT_TYPES.has(q.type) || q.type === "time",
        control,
      }}
    >
      <div
        data-slot="form-question"
        {...rest}
        data-question={q.id}
        className={cx("fg-fm-q", error && "fg-fm-q-bad", className)}
        onBlur={(event) => {
          if (onBlur && !event.currentTarget.contains(event.relatedTarget as Node | null)) onBlur();
        }}
      >
        {children ?? (
          <>
            {bare ? null : <FormQuestionFieldTitle />}
            {bare ? null : <FormQuestionFieldHelp />}
            <FormQuestionFieldControl />
            {bare ? null : <FormQuestionFieldError />}
          </>
        )}
      </div>
    </FormQuestionCtx.Provider>
  );
}

/** The title of the question, a label for the control of a text answer. */
export function FormQuestionFieldTitle({
  className,
  children,
  ...rest
}: Omit<ComponentProps<"div">, "ref">) {
  const { q, titleId, controlId, textual } = useFormQuestionField();
  const title = q.title.trim() || "Untitled question";
  const content = (
    <>
      {children ?? title}
      {q.required ? (
        <span className="fg-fm-req" aria-hidden="true">
          {" "}
          *
        </span>
      ) : null}
      {q.required ? <span className="fg-sr"> (required)</span> : null}
    </>
  );
  return textual ? (
    <label
      id={titleId}
      data-slot="form-question-title"
      htmlFor={controlId}
      {...(rest as ComponentProps<"label">)}
      className={cx("fg-fm-q-title", className)}
    >
      {content}
    </label>
  ) : (
    <div
      id={titleId}
      data-slot="form-question-title"
      {...rest}
      className={cx("fg-fm-q-title", className)}
    >
      {content}
    </div>
  );
}

/** The help text of the question; nothing when it has none. */
export function FormQuestionFieldHelp({
  className,
  children,
  ...rest
}: Omit<ComponentProps<"p">, "ref">) {
  const { q, helpId } = useFormQuestionField();
  const text = children ?? q.help;
  if (!text) return null;
  return (
    <p
      id={helpId}
      data-slot="form-question-help"
      {...rest}
      className={cx("fg-fm-q-help", className)}
    >
      {text}
    </p>
  );
}

/** The control of the question: the one its type calls for. */
export function FormQuestionFieldControl() {
  return <>{useFormQuestionField().control()}</>;
}

/** What is wrong with the answer; nothing when there is no error. */
export function FormQuestionFieldError({
  className,
  children,
  ...rest
}: Omit<ComponentProps<"p">, "ref">) {
  const { error, errorId } = useFormQuestionField();
  const text = children ?? error;
  if (!text) return null;
  return (
    <p
      id={errorId}
      data-slot="form-question-error"
      role="alert"
      {...rest}
      className={cx("fg-field-error fg-fm-q-error", className)}
    >
      {text}
    </p>
  );
}

/** The parts of an address a required question still lacks, so each shows the problem. */
function addressErrors(
  q: FormQuestion,
  answer: FormAnswer | undefined,
  message: string,
): Partial<Record<AddressPart, string>> {
  if (!q.required) return {};
  const a = (
    answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {}
  ) as FormAddress;
  const out: Partial<Record<AddressPart, string>> = {};
  for (const k of ["line1", "postcode", "city", "country"] as const)
    if (!a[k]?.trim()) out[k] = k === "line1" ? message : "Required";
  return out;
}

/* ---------------------------------------------------------------- The form */

export interface FormRendererProps extends Omit<
  ComponentProps<"form">,
  "ref" | "onChange" | "defaultValue" | "onSubmit" | "children"
> {
  schema: FormSchema;
  /** The answers by question id. Controlled or not. */
  value?: FormAnswers;
  defaultValue?: FormAnswers;
  onChange?: (answers: FormAnswers) => void;
  /** The typed answers of the questions shown, when the form is complete. */
  onSubmit?: (answers: FormAnswers) => void | Promise<void>;
  /** `pages`: one section at a time, with a progress bar. `single`: every section on one page. */
  layout?: "pages" | "single";
  /** A last step that lists the answers before sending. Default `true` for more than one page. */
  review?: boolean;
  /** The step shown, from 0; the review step comes after the last page. Controlled or not. */
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** Countries offered by address questions. */
  countries?: ReadonlyArray<{ value: string; label: string }>;
  /** Writes the title and description of the form above the first page. Default `true`. */
  showTitle?: boolean;
  headingLevel?: 1 | 2 | 3;
  disabled?: boolean;
  /** Shows the thanks screen; controlled when given. */
  submitted?: boolean;
  /** Shown after sending, in place of the form: `schema.thanks` by default. */
  thanks?: ReactNode;
  /** The parts, in the order you choose. Without them: header, progress, notice, pages, actions. */
  children?: ReactNode;
}

interface FormRendererContext {
  schema: FormSchema;
  answers: FormAnswers;
  setAnswer: (id: string, next: FormAnswer) => void;
  pages: ReturnType<typeof formPages>;
  /** The step shown, from 0; the review step counts as one. */
  page: number;
  steps: number;
  single: boolean;
  onReview: boolean;
  withReview: boolean;
  last: boolean;
  here: ReturnType<typeof formPages>;
  errors: ReturnType<typeof validateFormAnswers>;
  shown: ReadonlySet<string>;
  reveal: (ids: Iterable<string>) => void;
  notice: string;
  busy: boolean;
  disabled: boolean | undefined;
  countries: ReadonlyArray<{ value: string; label: string }> | undefined;
  showTitle: boolean;
  headingLevel: number;
  answered: number;
  total: number;
  uid: string;
  top: RefObject<HTMLElement | null>;
  goTo: (page: number) => void;
}

const [FormRendererCtx, useFormRenderer] = partContext<FormRendererContext>("FormRenderer");

/** The state of the enclosing `FormRenderer`: the answers, the step, the errors. */
export { useFormRenderer };

/** A heading of the given level (1 to 6), declared once so its state survives a render. */
function Heading({ level, ...rest }: { level: number } & HTMLAttributes<HTMLHeadingElement>) {
  return createElement(`h${Math.min(6, level)}`, rest);
}

/** The title and the description of the form, above its first page. */
export function FormRendererHeader({
  className,
  children,
  ...rest
}: Omit<ComponentProps<"header">, "ref">) {
  const { schema, showTitle, page, single, headingLevel } = useFormRenderer();
  if (!showTitle || !(page === 0 || single)) return null;
  return (
    <header data-slot="form-renderer-header" {...rest} className={cx("fg-fm-head", className)}>
      {children ?? (
        <>
          <Heading level={headingLevel} className="fg-fm-title">
            {schema.title}
          </Heading>
          {schema.description ? <p className="fg-fm-desc">{schema.description}</p> : null}
        </>
      )}
    </header>
  );
}

/** How far along the respondent is: the page, or the answers given. */
export function FormRendererProgress(props: { className?: string }) {
  const { single, steps, onReview, page, pages, answered, total } = useFormRenderer();
  if (single) {
    return (
      <Progress
        data-slot="form-renderer-progress"
        {...props}
        label={`${answered} of ${total} answered`}
        value={answered}
        max={Math.max(1, total)}
      />
    );
  }
  if (steps <= 1) return null;
  return (
    <Progress
      data-slot="form-renderer-progress"
      {...props}
      label={onReview ? "Review" : `Page ${page + 1} of ${pages.length}`}
      value={page + 1}
      max={steps}
    />
  );
}

/** What the respondent is told when a step cannot go on. */
export function FormRendererNotice({ className, ...rest }: Omit<ComponentProps<"p">, "ref">) {
  const { notice } = useFormRenderer();
  if (!notice) return null;
  return (
    <p
      data-slot="form-renderer-notice"
      role="alert"
      {...rest}
      className={cx("fg-fm-notice", className)}
    >
      {notice}
    </p>
  );
}

export interface FormRendererQuestionProps extends Omit<
  FormQuestionFieldProps,
  "question" | "value" | "defaultValue" | "onChange" | "error"
> {
  question: FormQuestion;
}

/** One question of the form, wired to its answer and its error. */
export function FormRendererQuestion({ question, ...rest }: FormRendererQuestionProps) {
  const { answers, setAnswer, errors, shown, reveal, countries, disabled } = useFormRenderer();
  return (
    <FormQuestionField
      question={question}
      value={answers[question.id] ?? null}
      onChange={(next) => setAnswer(question.id, next)}
      error={shown.has(question.id) ? errors[question.id] : null}
      {...(countries ? { countries } : {})}
      {...(disabled ? { disabled } : {})}
      onBlur={() => reveal([question.id])}
      {...rest}
    />
  );
}

export interface FormRendererPageProps extends Omit<ComponentProps<"section">, "ref"> {
  /** The page: a section of the schema and the questions shown in it. */
  page: FormPage;
  /** Gives the page the focus when the step changes. Set by `FormRendererPages` for the first. */
  first?: boolean;
}

/** One page: its title, its description and its questions. Its children replace the questions. */
export function FormRendererPage({
  page,
  first,
  className,
  children,
  ...rest
}: FormRendererPageProps) {
  const { top, headingLevel } = useFormRenderer();
  return (
    <section
      ref={first ? (top as RefObject<HTMLElement>) : undefined}
      tabIndex={first ? -1 : undefined}
      data-slot="form-renderer-page"
      aria-label={page.section.title || undefined}
      {...rest}
      className={cx("fg-fm-page", className)}
    >
      {page.section.title ? (
        <Heading level={headingLevel + 1} className="fg-fm-section">
          {page.section.title}
        </Heading>
      ) : null}
      {page.section.description ? <p className="fg-fm-desc">{page.section.description}</p> : null}
      {children ?? page.questions.map((q) => <FormRendererQuestion key={q.id} question={q} />)}
    </section>
  );
}

/** The last step: every answer listed, each page with a button to go back to it. */
export function FormRendererReview({
  className,
  children,
  ...rest
}: Omit<ComponentProps<"section">, "ref">) {
  const { pages, answers, errors, uid, top, headingLevel, goTo } = useFormRenderer();
  return (
    <section
      ref={top as RefObject<HTMLElement>}
      tabIndex={-1}
      data-slot="form-renderer-review"
      aria-labelledby={`${uid}-review`}
      {...rest}
      className={cx("fg-fm-review", className)}
    >
      <Heading level={headingLevel + 1} id={`${uid}-review`} className="fg-fm-section">
        Review your answers
      </Heading>
      {children ??
        pages.map((p, i) => (
          <div key={p.section.id} className="fg-fm-review-page">
            <div className="fg-fm-review-head">
              <span className="fg-fm-review-name">{p.section.title || `Page ${i + 1}`}</span>
              <Button variant="ghost" size="sm" onClick={() => goTo(i)}>
                Edit
                <span className="fg-sr"> {p.section.title || `page ${i + 1}`}</span>
              </Button>
            </div>
            <dl className="fg-fm-review-list">
              {p.questions.map((q) => {
                const line = formAnswerText(q, answers[q.id]);
                return (
                  <div key={q.id} className="fg-fm-review-row">
                    <dt>{q.title}</dt>
                    <dd className={cx(!line && "fg-fm-review-none")}>
                      {line || (q.required ? "Not answered" : "Skipped")}
                      {errors[q.id] ? (
                        <span className="fg-fm-review-bad"> {errors[q.id]}</span>
                      ) : null}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
    </section>
  );
}

/** The step shown: the review, or the page (every page with `layout="single"`). */
export function FormRendererPages() {
  const { onReview, here } = useFormRenderer();
  if (onReview) return <FormRendererReview />;
  return (
    <>
      {here.map((p, i) => (
        <FormRendererPage key={p.section.id} page={p} first={i === 0} />
      ))}
    </>
  );
}

/** "Back": the previous page. Absent on the first page and with `layout="single"`. */
export function FormRendererBack({
  children,
  ...rest
}: Omit<ComponentProps<"button">, "ref" | "onClick">) {
  const { single, page, goTo } = useFormRenderer();
  if (single || page <= 0) return null;
  return (
    <Button
      variant="secondary"
      data-slot="form-renderer-back"
      {...rest}
      onClick={() => goTo(page - 1)}
    >
      {children ?? "Back"}
    </Button>
  );
}

/** The button that goes on: "Next", "Review" or the submit label of the last step. */
export function FormRendererSubmit({
  children,
  ...rest
}: Omit<ComponentProps<"button">, "ref" | "type" | "onClick">) {
  const { schema, last, onReview, page, steps, withReview, disabled, busy } = useFormRenderer();
  return (
    <Button
      type="submit"
      variant="primary"
      data-slot="form-renderer-submit"
      disabled={disabled || busy}
      {...rest}
    >
      {children ??
        (last
          ? (schema.submitLabel ?? "Submit")
          : onReview
            ? "Submit"
            : page === steps - 2 && withReview
              ? "Review"
              : "Next")}
    </Button>
  );
}

/** Back and the button that goes on. Its children replace them. */
export function FormRendererActions({
  className,
  children,
  ...rest
}: Omit<ComponentProps<"div">, "ref">) {
  return (
    <div data-slot="form-renderer-actions" {...rest} className={cx("fg-fm-actions", className)}>
      {children ?? (
        <>
          <FormRendererBack />
          <FormRendererSubmit />
        </>
      )}
    </div>
  );
}

/** A form schema as a form to fill in. */
export function FormRenderer({
  schema,
  value,
  defaultValue,
  onChange,
  onSubmit,
  layout = "pages",
  review,
  page: pageProp,
  defaultPage = 0,
  onPageChange,
  countries,
  showTitle = true,
  headingLevel = 2,
  disabled,
  submitted: submittedProp,
  thanks,
  children,
  className,
  ...rest
}: FormRendererProps) {
  const [answers, setAnswers] = useControllableState<FormAnswers>({
    value,
    defaultValue: defaultValue ?? {},
    onChange,
  });
  const [pageState, setPage] = useControllableState<number>({
    value: pageProp,
    defaultValue: defaultPage,
    onChange: onPageChange,
  });
  const [sentOwn, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState("");
  const root = useRef<HTMLFormElement>(null);
  const top = useRef<HTMLElement>(null);
  const moved = useRef(false);
  const uid = useId();
  const sent = submittedProp ?? sentOwn;

  const pages = formPages(schema, answers);
  const single = layout === "single";
  const withReview = !single && (review ?? pages.length > 1);
  const steps = single ? 1 : pages.length + (withReview ? 1 : 0);
  const page = Math.max(0, Math.min(steps - 1, pageState));
  const onReview = withReview && page === pages.length;
  const errors = validateFormAnswers(schema, answers);
  const here = single ? pages : onReview ? [] : pages[page] ? [pages[page]!] : [];
  const last = single || page === steps - 1;

  // Focus follows the step: the heading of the new page is the first thing read.
  useEffect(() => {
    if (!moved.current) {
      moved.current = true;
      return;
    }
    top.current?.focus();
  }, [page, sent]);

  const reveal = (ids: Iterable<string>) => setShown((s) => new Set([...s, ...ids]));

  const focusQuestion = (id: string) =>
    requestAnimationFrame(() =>
      root.current
        ?.querySelector<HTMLElement>(
          `[data-question="${CSS.escape(id)}"] :is(input, textarea, button, [tabindex="0"]):not([disabled])`,
        )
        ?.focus(),
    );

  const problemsOf = (ids: ReadonlyArray<string>) => ids.filter((id) => errors[id]);

  const send = async () => {
    const bad = Object.keys(errors);
    if (bad.length) {
      reveal(bad);
      const at = pages.findIndex((p) => p.questions.some((q) => errors[q.id]));
      if (!single && at >= 0) setPage(at);
      setNotice(
        `${bad.length} ${bad.length === 1 ? "question needs" : "questions need"} attention.`,
      );
      focusQuestion(bad[0]!);
      return;
    }
    setNotice("");
    if (!onSubmit) {
      setSent(true);
      return;
    }
    setBusy(true);
    try {
      await onSubmit(cleanFormAnswers(schema, answers));
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || busy) return;
    if (single || onReview || (last && !withReview)) {
      void send();
      return;
    }
    const ids = here.flatMap((p) => p.questions.map((q) => q.id));
    const bad = problemsOf(ids);
    reveal(ids);
    if (bad.length) {
      setNotice(
        `${bad.length} ${bad.length === 1 ? "question needs" : "questions need"} attention.`,
      );
      focusQuestion(bad[0]!);
      return;
    }
    setNotice("");
    setPage(page + 1);
  };

  if (sent) {
    return (
      <section
        ref={top}
        tabIndex={-1}
        data-slot="form-renderer"
        className={cx("fg-fm fg-fm-thanks", className)}
        aria-label={schema.title}
      >
        <Heading level={headingLevel} className="fg-fm-title">
          {schema.title}
        </Heading>
        <p role="status" className="fg-fm-thanks-text">
          {thanks ?? schema.thanks ?? "Thank you. Your answers are sent."}
        </p>
      </section>
    );
  }

  if (pages.length === 0)
    return (
      <section
        data-slot="form-renderer"
        className={cx("fg-fm", className)}
        aria-label={schema.title}
      >
        <Heading level={headingLevel} className="fg-fm-title">
          {schema.title}
        </Heading>
        <p className="fg-fm-empty">This form has no question to answer.</p>
      </section>
    );

  const all = pages.flatMap((p) => p.questions);
  const answered = all.filter((q) => !isFormAnswerEmpty(q, answers[q.id])).length;

  return (
    <FormRendererCtx.Provider
      value={{
        schema,
        answers,
        setAnswer: (id, next) => setAnswers((a) => ({ ...a, [id]: next })),
        pages,
        page,
        steps,
        single,
        onReview,
        withReview,
        last,
        here,
        errors,
        shown,
        reveal,
        notice,
        busy,
        disabled,
        countries,
        showTitle,
        headingLevel,
        answered,
        total: all.length,
        uid,
        top,
        goTo: setPage,
      }}
    >
      <form
        ref={root}
        noValidate
        data-slot="form-renderer"
        aria-label={schema.title}
        {...rest}
        className={cx("fg-fm", className)}
        onSubmit={submit}
      >
        {children ?? (
          <>
            <FormRendererHeader />
            <FormRendererProgress />
            <FormRendererNotice />
            <FormRendererPages />
            <FormRendererActions />
          </>
        )}
      </form>
    </FormRendererCtx.Provider>
  );
}
