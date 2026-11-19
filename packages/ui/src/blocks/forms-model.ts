// The model of the "forms" blocks: a serialisable form schema (sections, questions, options,
// validation, show-if rules) and the pure helpers around it: what is visible for a set of answers,
// what is valid, how a text becomes an answer, how responses sum up. No React, no DOM: the blocks
// are thin around these and a server can run the same checks on a submission.

import {
  Attachment01Icon,
  CalendarClockIcon,
  CheckmarkSquare02Icon,
  CircleArrowDown01Icon,
  Clock01Icon,
  GaugeIcon,
  HashtagIcon,
  MapPinIcon,
  PenTool03Icon,
  Radio01Icon,
  Sorting05Icon,
  StarIcon,
  Table01Icon,
  TextAlignLeftIcon,
  TextIcon,
  type IconDefinition,
} from "@forgeron/icons";
import type { GridCell, GridColumn } from "../data-grid";
import {
  evaluateCondition,
  isConditionGroup,
  type ConditionField,
  type ConditionGroup,
  type ConditionRule,
} from "./automation-model";

/* ---------------------------------------------------------------- Schema */

export type QuestionType =
  | "shortText"
  | "longText"
  | "singleChoice"
  | "multiChoice"
  | "dropdown"
  | "number"
  | "date"
  | "time"
  | "rating"
  | "scale"
  | "matrix"
  | "ranking"
  | "file"
  | "address"
  | "signature";

export type QuestionGroup =
  | "text"
  | "choice"
  | "number"
  | "date"
  | "rating"
  | "structured"
  | "upload";

export interface QuestionTypeInfo {
  type: QuestionType;
  label: string;
  hint: string;
  group: QuestionGroup;
  icon: IconDefinition;
}

/** Every type of question, in the order the add menu lists them. */
export const FORM_QUESTION_TYPES: ReadonlyArray<QuestionTypeInfo> = [
  {
    type: "shortText",
    label: "Short text",
    hint: "One line: a name, an email, a link",
    group: "text",
    icon: TextIcon,
  },
  {
    type: "longText",
    label: "Long text",
    hint: "A paragraph",
    group: "text",
    icon: TextAlignLeftIcon,
  },
  {
    type: "singleChoice",
    label: "Single choice",
    hint: "One option among a few, all visible",
    group: "choice",
    icon: Radio01Icon,
  },
  {
    type: "multiChoice",
    label: "Multiple choice",
    hint: "Any number of options",
    group: "choice",
    icon: CheckmarkSquare02Icon,
  },
  {
    type: "dropdown",
    label: "Dropdown",
    hint: "One option among many",
    group: "choice",
    icon: CircleArrowDown01Icon,
  },
  {
    type: "number",
    label: "Number",
    hint: "A quantity, with limits",
    group: "number",
    icon: HashtagIcon,
  },
  { type: "date", label: "Date", hint: "A day", group: "date", icon: CalendarClockIcon },
  { type: "time", label: "Time", hint: "A time of day", group: "date", icon: Clock01Icon },
  {
    type: "rating",
    label: "Rating",
    hint: "Stars, 1 to 10 of them",
    group: "rating",
    icon: StarIcon,
  },
  {
    type: "scale",
    label: "Scale",
    hint: "A row of numbers, or NPS from 0 to 10",
    group: "rating",
    icon: GaugeIcon,
  },
  {
    type: "matrix",
    label: "Matrix",
    hint: "Rows to rate against the same columns",
    group: "structured",
    icon: Table01Icon,
  },
  {
    type: "ranking",
    label: "Ranking",
    hint: "Put the options in order",
    group: "structured",
    icon: Sorting05Icon,
  },
  {
    type: "address",
    label: "Address",
    hint: "Street, postcode, city, country",
    group: "structured",
    icon: MapPinIcon,
  },
  {
    type: "signature",
    label: "Signature",
    hint: "Drawn, typed or uploaded",
    group: "structured",
    icon: PenTool03Icon,
  },
  {
    type: "file",
    label: "File upload",
    hint: "One or several files",
    group: "upload",
    icon: Attachment01Icon,
  },
];

export const FORM_GROUP_NAMES: Record<QuestionGroup, string> = {
  text: "Text",
  choice: "Choice",
  number: "Numbers",
  date: "Date and time",
  rating: "Rating",
  structured: "Structured",
  upload: "Upload",
};

export const formQuestionInfo = (type: QuestionType): QuestionTypeInfo =>
  FORM_QUESTION_TYPES.find((t) => t.type === type) ?? FORM_QUESTION_TYPES[0]!;

export interface FormOption {
  id: string;
  label: string;
}

export interface FormValidation {
  /** Short text: the shape of the answer. */
  format?: "email" | "url";
  minLength?: number;
  maxLength?: number;
  /** A regular expression the whole answer must match (short text). */
  pattern?: string;
  /** Said when the pattern does not match. */
  patternMessage?: string;
  /** Number: the limits. */
  min?: number;
  max?: number;
  /** Number: whole numbers only. */
  integer?: boolean;
  /** Multiple choice: how many options may be ticked. */
  minSelected?: number;
  maxSelected?: number;
  /** Date: the earliest and latest day, `YYYY-MM-DD`. */
  minDate?: string;
  maxDate?: string;
  /** File: what is taken, in the `accept` syntax of an input. */
  accept?: string;
  maxFiles?: number;
  /** File: the largest file, in megabytes. */
  maxSizeMb?: number;
}

export interface FormRange {
  min: number;
  max: number;
  lowLabel?: string;
  highLabel?: string;
  /** A scale as a net promoter score: 0 to 10, read as detractors, passives and promoters. */
  nps?: boolean;
}

export interface FormQuestion {
  id: string;
  type: QuestionType;
  title: string;
  help?: string;
  required?: boolean;
  placeholder?: string;
  /** Choices, the items of a ranking, the rows of a matrix. */
  options?: FormOption[];
  /** The columns of a matrix. */
  columns?: FormOption[];
  /** Matrix: several columns may be chosen on a row. */
  multiple?: boolean;
  /** Rating (`max` stars) and scale. */
  range?: FormRange;
  validation?: FormValidation;
  /** Shown only when this holds. Rules read the answers by question id. */
  showIf?: ConditionGroup;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  questions: FormQuestion[];
  showIf?: ConditionGroup;
}

export interface FormSchema {
  version: 1;
  title: string;
  description?: string;
  sections: FormSection[];
  /** The label of the last button. */
  submitLabel?: string;
  /** Said once the form is sent. */
  thanks?: string;
}

/* ---------------------------------------------------------------- Answers */

export interface FormAddress {
  line1?: string;
  line2?: string;
  postcode?: string;
  city?: string;
  country?: string;
}

export interface FormFileAnswer {
  name: string;
  size: number;
  type: string;
  /** The file itself, while it is in the page; not serialised. */
  file?: File;
}

export interface FormSignatureAnswer {
  dataUrl: string;
  method: "draw" | "type" | "upload";
  text?: string;
  font?: string;
}

export type FormMatrixAnswer = Record<string, string | string[]>;

export type FormAnswer =
  | string
  | number
  | string[]
  | FormMatrixAnswer
  | FormAddress
  | FormFileAnswer[]
  | FormSignatureAnswer
  | null;

/** The answers by question id. A question left out, or `null`, is unanswered. */
export type FormAnswers = Record<string, FormAnswer | undefined>;

export interface FormResponse {
  id: string;
  /** An ISO date or datetime. */
  submittedAt?: string;
  answers: FormAnswers;
}

/* ---------------------------------------------------------------- Ids and building */

let counter = 0;

/** An id not in `taken`: `q1`, `q2`… */
export function freshFormId(prefix: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  let id: string;
  do id = `${prefix}${(++counter).toString(36)}`;
  while (used.has(id));
  return id;
}

/** Every id of the schema: sections, questions, options, columns. */
export function formAllIds(schema: FormSchema): string[] {
  const ids: string[] = [];
  for (const s of schema.sections) {
    ids.push(s.id);
    for (const q of s.questions) {
      ids.push(q.id);
      for (const o of [...(q.options ?? []), ...(q.columns ?? [])]) ids.push(o.id);
    }
  }
  return ids;
}

/** The questions in the order they are asked. */
export const formQuestions = (schema: FormSchema): FormQuestion[] =>
  schema.sections.flatMap((s) => s.questions);

export const isChoiceType = (type: QuestionType) =>
  type === "singleChoice" || type === "multiChoice" || type === "dropdown";

/** The types whose `options` are the thing being answered. */
export const usesOptions = (type: QuestionType) =>
  isChoiceType(type) || type === "ranking" || type === "matrix";

/** A blank form: one section, no question. */
export function emptyForm(title = "Untitled form"): FormSchema {
  return { version: 1, title, sections: [{ id: "s1", title: "", questions: [] }] };
}

export function newFormSection(taken: Iterable<string>, title = ""): FormSection {
  return { id: freshFormId("s", taken), title, questions: [] };
}

const options = (labels: ReadonlyArray<string>, taken: string[]): FormOption[] =>
  labels.map((label) => {
    const id = freshFormId("o", taken);
    taken.push(id);
    return { id, label };
  });

/** A new question of `type` with sensible defaults. `taken` keeps the ids unique. */
export function newFormQuestion(
  type: QuestionType,
  id: string,
  taken: string[] = [id],
): FormQuestion {
  const q: FormQuestion = { id, type, title: "" };
  if (isChoiceType(type)) q.options = options(["Option 1", "Option 2"], taken);
  if (type === "ranking") q.options = options(["Item 1", "Item 2", "Item 3"], taken);
  if (type === "matrix") {
    q.options = options(["Row 1", "Row 2"], taken);
    q.columns = options(["Column 1", "Column 2", "Column 3"], taken);
  }
  if (type === "rating") q.range = { min: 1, max: 5 };
  if (type === "scale") q.range = { min: 1, max: 5 };
  return q;
}

/** The same question as another type: the words stay, what no longer applies goes. */
export function convertFormQuestion(q: FormQuestion, type: QuestionType): FormQuestion {
  if (q.type === type) return q;
  const next = newFormQuestion(type, q.id);
  const keep: FormQuestion = { ...next, title: q.title };
  if (q.help !== undefined) keep.help = q.help;
  if (q.required !== undefined) keep.required = q.required;
  if (q.showIf) keep.showIf = q.showIf;
  if (q.options && usesOptions(type) && usesOptions(q.type)) keep.options = q.options;
  if (q.columns && type === "matrix") keep.columns = q.columns;
  if (
    q.range &&
    (type === "scale" || type === "rating") &&
    (q.type === "scale" || q.type === "rating")
  )
    keep.range = type === "rating" ? { min: 1, max: Math.min(10, q.range.max) } : q.range;
  return keep;
}

/** Moves one item of a list: a copy. */
export function moveFormItem<T>(list: ReadonlyArray<T>, from: number, to: number): T[] {
  const next = [...list];
  if (from < 0 || from >= next.length) return next;
  const target = Math.max(0, Math.min(next.length - 1, to));
  const [item] = next.splice(from, 1);
  next.splice(target, 0, item!);
  return next;
}

const mapQuestions = (
  schema: FormSchema,
  fn: (q: FormQuestion, section: FormSection) => FormQuestion | null,
): FormSchema => ({
  ...schema,
  sections: schema.sections.map((s) => ({
    ...s,
    questions: s.questions.flatMap((q) => {
      const next = fn(q, s);
      return next ? [next] : [];
    }),
  })),
});

export function updateFormQuestion(
  schema: FormSchema,
  id: string,
  patch: Partial<FormQuestion> | ((q: FormQuestion) => FormQuestion),
): FormSchema {
  return mapQuestions(schema, (q) =>
    q.id !== id ? q : typeof patch === "function" ? patch(q) : { ...q, ...patch },
  );
}

/** Where a question is: its section and its index in it. */
export function findFormQuestion(
  schema: FormSchema,
  id: string,
): { section: number; index: number; question: FormQuestion } | null {
  for (const [section, s] of schema.sections.entries()) {
    const index = s.questions.findIndex((q) => q.id === id);
    if (index >= 0) return { section, index, question: s.questions[index]! };
  }
  return null;
}

/** Drops the rules that read a question that is gone (or cannot be read), and the groups left empty. */
export function pruneFormLogic(schema: FormSchema): FormSchema {
  const readable = new Set(
    formQuestions(schema)
      .filter((q) => FORM_LOGIC_TYPES.has(q.type))
      .map((q) => q.id),
  );
  const prune = (group: ConditionGroup): ConditionGroup | undefined => {
    const rules = group.rules.flatMap((r): Array<ConditionRule | ConditionGroup> => {
      if (isConditionGroup(r)) {
        const inner = prune(r);
        return inner ? [inner] : [];
      }
      return readable.has(r.field) ? [r] : [];
    });
    return rules.length ? { ...group, rules } : undefined;
  };
  const clean = <T extends { showIf?: ConditionGroup }>(item: T): T => {
    // A rule being written (a group with no rule yet) stays.
    if (!item.showIf || item.showIf.rules.length === 0) return item;
    const { showIf, ...rest } = item;
    const pruned = prune(showIf);
    return (pruned ? { ...rest, showIf: pruned } : rest) as T;
  };
  return {
    ...schema,
    sections: schema.sections.map((s) => ({ ...clean(s), questions: s.questions.map(clean) })),
  };
}

export function removeFormQuestion(schema: FormSchema, id: string): FormSchema {
  return pruneFormLogic(mapQuestions(schema, (q) => (q.id === id ? null : q)));
}

const copyOptions = (list: FormOption[] | undefined, taken: string[]) =>
  list?.map((o) => {
    const id = freshFormId("o", taken);
    taken.push(id);
    return { ...o, id };
  });

/** A copy of the question just after it, with fresh ids; its show-if rules are kept. */
export function duplicateFormQuestion(schema: FormSchema, id: string): FormSchema {
  const at = findFormQuestion(schema, id);
  if (!at) return schema;
  const taken = formAllIds(schema);
  const copyId = freshFormId("q", taken);
  taken.push(copyId);
  const copy: FormQuestion = { ...at.question, id: copyId };
  const opts = copyOptions(at.question.options, taken);
  const cols = copyOptions(at.question.columns, taken);
  if (opts) copy.options = opts;
  if (cols) copy.columns = cols;
  if (at.question.title) copy.title = `${at.question.title} (copy)`;
  return {
    ...schema,
    sections: schema.sections.map((s, i) =>
      i !== at.section
        ? s
        : {
            ...s,
            questions: [
              ...s.questions.slice(0, at.index + 1),
              copy,
              ...s.questions.slice(at.index + 1),
            ],
          },
    ),
  };
}

/** Puts the question at `index` of a section (the index it will have in the end). */
export function moveFormQuestionTo(
  schema: FormSchema,
  id: string,
  sectionId: string,
  index: number,
): FormSchema {
  const at = findFormQuestion(schema, id);
  const target = schema.sections.findIndex((s) => s.id === sectionId);
  if (!at || target < 0) return schema;
  const without = schema.sections.map((s) => ({
    ...s,
    questions: s.questions.filter((q) => q.id !== id),
  }));
  const into = without[target]!;
  const at2 = Math.max(0, Math.min(into.questions.length, index));
  const questions = [...into.questions.slice(0, at2), at.question, ...into.questions.slice(at2)];
  return pruneFormLogic({
    ...schema,
    sections: without.map((s, i) => (i === target ? { ...s, questions } : s)),
  });
}

/** One place up or down; past the end of a section it goes into the neighbouring one. */
export function moveFormQuestion(schema: FormSchema, id: string, delta: -1 | 1): FormSchema {
  const at = findFormQuestion(schema, id);
  if (!at) return schema;
  const size = schema.sections[at.section]!.questions.length;
  const to = at.index + delta;
  if (to >= 0 && to < size)
    return moveFormQuestionTo(schema, id, schema.sections[at.section]!.id, to);
  const other = schema.sections[at.section + delta];
  if (!other) return schema;
  return moveFormQuestionTo(schema, id, other.id, delta < 0 ? other.questions.length : 0);
}

export function moveFormSection(schema: FormSchema, id: string, delta: -1 | 1): FormSchema {
  const from = schema.sections.findIndex((s) => s.id === id);
  if (from < 0) return schema;
  return pruneFormLogic({ ...schema, sections: moveFormItem(schema.sections, from, from + delta) });
}

/* ---------------------------------------------------------------- Logic */

/** The types of question a show-if rule can read. */
export const FORM_LOGIC_TYPES: ReadonlySet<QuestionType> = new Set<QuestionType>([
  "shortText",
  "longText",
  "singleChoice",
  "multiChoice",
  "dropdown",
  "number",
  "date",
  "rating",
  "scale",
]);

const conditionType = (type: QuestionType): ConditionField["type"] =>
  type === "number" || type === "rating" || type === "scale"
    ? "number"
    : type === "date"
      ? "date"
      : isChoiceType(type)
        ? "enum"
        : "text";

/**
 * The fields a ConditionBuilder offers for a show-if: the questions asked before `before` (a
 * question id, or a section id for the rule of a whole section), in order.
 */
export function formConditionFields(schema: FormSchema, before?: string): ConditionField[] {
  const out: ConditionField[] = [];
  for (const s of schema.sections) {
    if (s.id === before) break;
    for (const q of s.questions) {
      if (q.id === before) return out;
      if (!FORM_LOGIC_TYPES.has(q.type)) continue;
      const field: ConditionField = {
        id: q.id,
        label: q.title.trim() || formQuestionInfo(q.type).label,
        type: conditionType(q.type),
      };
      if (isChoiceType(q.type))
        field.options = (q.options ?? []).map((o) => ({ value: o.id, label: o.label || "Option" }));
      out.push(field);
    }
  }
  return out;
}

const textOf = (answer: FormAnswer | undefined): string | number | undefined => {
  if (typeof answer === "string" || typeof answer === "number") return answer;
  if (Array.isArray(answer)) return (answer as string[]).join(",");
  return undefined;
};

function showIfHolds(
  group: ConditionGroup,
  item: Record<string, unknown>,
  lists: Record<string, string[]>,
): boolean {
  if (group.rules.length === 0) return true;
  const results = group.rules.map((r) => {
    if (isConditionGroup(r)) return showIfHolds(r, item, lists);
    const list = lists[r.field];
    // A box that is ticked among others still makes "is" true.
    if (list && (r.operator === "eq" || r.operator === "neq")) {
      const has = list.includes(r.value ?? "");
      return r.operator === "eq" ? has : !has;
    }
    return evaluateCondition({ id: "rule", combinator: "and", rules: [r] }, item);
  });
  return group.combinator === "and" ? results.every(Boolean) : results.some(Boolean);
}

export interface FormVisibility {
  sections: Record<string, boolean>;
  questions: Record<string, boolean>;
}

/**
 * What is shown for a set of answers. A hidden question counts as unanswered for the rules that
 * come after it, so a chain of conditions unwinds the way a respondent sees it.
 */
export function formVisibility(schema: FormSchema, answers: FormAnswers): FormVisibility {
  const sections: Record<string, boolean> = {};
  const questions: Record<string, boolean> = {};
  const item: Record<string, unknown> = {};
  const lists: Record<string, string[]> = {};
  for (const s of schema.sections) {
    const sectionShown = !s.showIf || showIfHolds(s.showIf, item, lists);
    sections[s.id] = sectionShown;
    for (const q of s.questions) {
      const shown = sectionShown && (!q.showIf || showIfHolds(q.showIf, item, lists));
      questions[q.id] = shown;
      if (!shown) continue;
      const a = answers[q.id];
      const value = textOf(a);
      if (value !== undefined) item[q.id] = value;
      if (Array.isArray(a)) lists[q.id] = a as string[];
    }
  }
  return { sections, questions };
}

export interface FormPage {
  section: FormSection;
  /** The questions shown for the answers. */
  questions: FormQuestion[];
}

/** The pages a respondent goes through: sections shown, with the questions shown in them. */
export function formPages(schema: FormSchema, answers: FormAnswers): FormPage[] {
  const seen = formVisibility(schema, answers);
  return schema.sections
    .filter((s) => seen.sections[s.id])
    .map((section) => ({
      section,
      questions: section.questions.filter((q) => seen.questions[q.id]),
    }))
    .filter((p) => p.questions.length > 0);
}

/* ---------------------------------------------------------------- Validation */

const isText = (a: FormAnswer | undefined): a is string => typeof a === "string";

/** Whether the answer says nothing. */
export function isFormAnswerEmpty(q: FormQuestion, answer: FormAnswer | undefined): boolean {
  if (answer === undefined || answer === null) return true;
  if (typeof answer === "string") return answer.trim() === "";
  if (typeof answer === "number") return Number.isNaN(answer);
  if (Array.isArray(answer)) return answer.length === 0;
  if (q.type === "address")
    return Object.values(answer as FormAddress).every((v) => !v || String(v).trim() === "");
  if (q.type === "matrix")
    return Object.values(answer as FormMatrixAnswer).every((v) =>
      Array.isArray(v) ? !v.length : !v,
    );
  return false;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function urlOk(text: string): boolean {
  try {
    const u = new URL(text);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * The problem with an answer, said as what to do, or `null`. An empty answer is a problem only
 * when the question is required.
 */
export function validateFormAnswer(q: FormQuestion, answer: FormAnswer | undefined): string | null {
  const v = q.validation ?? {};
  if (isFormAnswerEmpty(q, answer)) {
    if (!q.required) return null;
    return q.type === "singleChoice" || q.type === "multiChoice" || q.type === "dropdown"
      ? "Choose an option."
      : q.type === "signature"
        ? "Sign here."
        : q.type === "file"
          ? "Add a file."
          : "Answer this question.";
  }
  switch (q.type) {
    case "shortText":
    case "longText": {
      const text = (answer as string).trim();
      if (v.minLength !== undefined && text.length < v.minLength)
        return `Write at least ${plural(v.minLength, "character")}.`;
      if (v.maxLength !== undefined && text.length > v.maxLength)
        return `Keep it to ${plural(v.maxLength, "character")} at most.`;
      if (v.format === "email" && !EMAIL.test(text))
        return "Enter an email address, like name@example.com.";
      if (v.format === "url" && !urlOk(text))
        return "Enter a link starting with http:// or https://.";
      if (v.pattern) {
        try {
          if (!new RegExp(`^(?:${v.pattern})$`).test(text))
            return v.patternMessage || "This does not match the expected format.";
        } catch {
          return null;
        }
      }
      return null;
    }
    case "number": {
      const n = answer as number;
      if (typeof n !== "number") return "Enter a number.";
      if (v.integer && !Number.isInteger(n)) return "Enter a whole number.";
      if (v.min !== undefined && n < v.min) return `Enter ${v.min} or more.`;
      if (v.max !== undefined && n > v.max) return `Enter ${v.max} or less.`;
      return null;
    }
    case "multiChoice": {
      const n = (answer as string[]).length;
      if (v.minSelected !== undefined && n < v.minSelected)
        return `Choose at least ${plural(v.minSelected, "option")}.`;
      if (v.maxSelected !== undefined && n > v.maxSelected)
        return `Choose ${plural(v.maxSelected, "option")} at most.`;
      return null;
    }
    case "date": {
      const d = answer as string;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return "Enter a date.";
      if (v.minDate && d < v.minDate) return `Pick a day on or after ${v.minDate}.`;
      if (v.maxDate && d > v.maxDate) return `Pick a day on or before ${v.maxDate}.`;
      return null;
    }
    case "time":
      return /^([01]?\d|2[0-3]):[0-5]\d$/.test(answer as string)
        ? null
        : "Enter a time, like 14:30.";
    case "rating":
    case "scale": {
      const n = answer as number;
      const r = q.range ?? { min: 1, max: 5 };
      return typeof n === "number" && n >= r.min && n <= r.max
        ? null
        : "Pick a value on the scale.";
    }
    case "matrix": {
      const rows = q.options ?? [];
      const a = answer as FormMatrixAnswer;
      const left = rows.filter((r) => {
        const x = a[r.id];
        return Array.isArray(x) ? x.length === 0 : !x;
      });
      return q.required && left.length ? "Answer every row." : null;
    }
    case "ranking":
      return (answer as string[]).length === (q.options ?? []).length ? null : "Rank every item.";
    case "address": {
      const a = answer as FormAddress;
      if (!q.required) return null;
      const missing = (["line1", "postcode", "city", "country"] as const).filter(
        (k) => !a[k]?.trim(),
      );
      return missing.length ? "Complete the address: street, postcode, city and country." : null;
    }
    case "file": {
      const files = answer as FormFileAnswer[];
      if (v.maxFiles !== undefined && files.length > v.maxFiles)
        return `Add ${plural(v.maxFiles, "file")} at most.`;
      if (v.maxSizeMb !== undefined && files.some((f) => f.size > v.maxSizeMb! * 1_000_000))
        return `Each file must be under ${v.maxSizeMb} MB.`;
      return null;
    }
    default:
      return null;
  }
}

/** The problems of the questions shown, by question id. Hidden questions are never a problem. */
export function validateFormAnswers(
  schema: FormSchema,
  answers: FormAnswers,
): Record<string, string> {
  const seen = formVisibility(schema, answers);
  const errors: Record<string, string> = {};
  for (const q of formQuestions(schema)) {
    if (!seen.questions[q.id]) continue;
    const problem = validateFormAnswer(q, answers[q.id]);
    if (problem) errors[q.id] = problem;
  }
  return errors;
}

/** The answers that count: questions shown and answered, text trimmed. */
export function cleanFormAnswers(schema: FormSchema, answers: FormAnswers): FormAnswers {
  const seen = formVisibility(schema, answers);
  const out: FormAnswers = {};
  for (const q of formQuestions(schema)) {
    const a = answers[q.id];
    if (!seen.questions[q.id] || isFormAnswerEmpty(q, a)) continue;
    out[q.id] = isText(a) ? a.trim() : (a as FormAnswer);
  }
  return out;
}

/* ---------------------------------------------------------------- Reading and writing answers */

const norm = (s: string) => s.trim().toLowerCase();
const matchOption = (list: ReadonlyArray<FormOption> | undefined, text: string) => {
  const t = norm(text);
  return (list ?? []).find((o) => o.id === text.trim() || norm(o.label) === t);
};

/**
 * Reads an answer from text, the way a prefilled link, a CSV cell or a paste gives it: options by
 * label or id, lists split on `,` `;` or `|`, a matrix as `row=column;row=column`, an address as
 * `line 1|line 2|postcode|city|country`. `null` when the text is not an answer to the question.
 */
export function parseFormAnswer(q: FormQuestion, raw: string): FormAnswer {
  const text = raw.trim();
  if (text === "") return null;
  const parts = () =>
    text
      .split(/[,;|]/)
      .map((p) => p.trim())
      .filter(Boolean);
  switch (q.type) {
    case "shortText":
    case "longText":
      return text;
    case "singleChoice":
    case "dropdown":
      return matchOption(q.options, text)?.id ?? null;
    case "multiChoice": {
      const ids = parts().map((p) => matchOption(q.options, p)?.id);
      return ids.length && ids.every(Boolean) ? [...new Set(ids as string[])] : null;
    }
    case "ranking": {
      const ids = parts().map((p) => matchOption(q.options, p)?.id);
      return ids.length && ids.every(Boolean) ? [...new Set(ids as string[])] : null;
    }
    case "number": {
      const n = Number(text.replace(/\s/g, "").replace(",", "."));
      return Number.isFinite(n) ? n : null;
    }
    case "rating":
    case "scale": {
      const n = Number(text);
      const r = q.range ?? { min: 1, max: 5 };
      return Number.isInteger(n) && n >= r.min && n <= r.max ? n : null;
    }
    case "date":
      return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
    case "time": {
      const m = /^(\d{1,2}):(\d{2})$/.exec(text);
      return m && Number(m[1]) < 24 && Number(m[2]) < 60
        ? `${m[1]!.padStart(2, "0")}:${m[2]}`
        : null;
    }
    case "matrix": {
      const out: FormMatrixAnswer = {};
      for (const pair of text.split(";")) {
        const [r, c] = pair.split("=").map((s) => s.trim());
        const row = matchOption(q.options, r ?? "");
        const cols = (c ?? "").split(/[,|]/).map((x) => matchOption(q.columns, x)?.id);
        if (!row || !cols.length || !cols.every(Boolean)) return null;
        out[row.id] = q.multiple ? (cols as string[]) : cols[0]!;
      }
      return Object.keys(out).length ? out : null;
    }
    case "address": {
      const [line1, line2, postcode, city, country] = text.split("|").map((s) => s.trim());
      return { line1, line2, postcode, city, country };
    }
    default:
      return null;
  }
}

const label = (list: ReadonlyArray<FormOption> | undefined, id: string) =>
  list?.find((o) => o.id === id)?.label ?? id;

/** An answer as a line of text: for a review step, a table cell, an export. */
export function formAnswerText(q: FormQuestion, answer: FormAnswer | undefined): string {
  if (isFormAnswerEmpty(q, answer)) return "";
  switch (q.type) {
    case "singleChoice":
    case "dropdown":
      return label(q.options, answer as string);
    case "multiChoice":
      return (answer as string[]).map((id) => label(q.options, id)).join(", ");
    case "ranking":
      return (answer as string[]).map((id, i) => `${i + 1}. ${label(q.options, id)}`).join(", ");
    case "matrix":
      return Object.entries(answer as FormMatrixAnswer)
        .filter(([, v]) => (Array.isArray(v) ? v.length : v))
        .map(([row, v]) => {
          const cols = Array.isArray(v) ? v : [v];
          return `${label(q.options, row)}: ${cols.map((c) => label(q.columns, c)).join(" + ")}`;
        })
        .join("; ");
    case "address": {
      const a = answer as FormAddress;
      return [a.line1, a.line2, [a.postcode, a.city].filter(Boolean).join(" "), a.country]
        .filter((p) => p && p.trim())
        .join(", ");
    }
    case "file":
      return (answer as FormFileAnswer[]).map((f) => f.name).join(", ");
    case "signature":
      return "Signed";
    case "rating":
      return `${answer} / ${q.range?.max ?? 5}`;
    default:
      return String(answer);
  }
}

/* ---------------------------------------------------------------- Problems of a schema */

export interface FormProblem {
  /** Absent for a problem of the whole form. */
  questionId?: string;
  sectionId?: string;
  message: string;
}

/** What is wrong with the form itself, before anyone answers it. */
export function formProblems(schema: FormSchema): FormProblem[] {
  const out: FormProblem[] = [];
  const questions = formQuestions(schema);
  if (questions.length === 0) out.push({ message: "The form has no question." });
  const ids = formAllIds(schema);
  if (new Set(ids).size !== ids.length) out.push({ message: "Two items share an id." });
  const before = new Set<string>();
  for (const s of schema.sections) {
    const logic = (
      group: ConditionGroup | undefined,
      where: { questionId?: string; sectionId?: string },
    ) => {
      if (!group) return;
      for (const r of group.rules) {
        if (isConditionGroup(r)) logic(r, where);
        else if (!before.has(r.field))
          out.push({
            ...where,
            message: "A show-if rule reads a question that comes later or is gone.",
          });
      }
    };
    logic(s.showIf, { sectionId: s.id });
    for (const q of s.questions) {
      const at = { questionId: q.id };
      const bad = (message: string) => out.push({ ...at, message });
      if (!q.title.trim()) bad("The question has no title.");
      if (isChoiceType(q.type) || q.type === "ranking") {
        const labels = (q.options ?? []).map((o) => norm(o.label));
        if (labels.length < 2) bad("Give at least two options.");
        else if (labels.some((l) => !l)) bad("An option has no label.");
        else if (new Set(labels).size !== labels.length) bad("Two options have the same label.");
      }
      if (q.type === "matrix") {
        if (!(q.options ?? []).length) bad("Give the matrix at least one row.");
        if ((q.columns ?? []).length < 2) bad("Give the matrix at least two columns.");
        if ([...(q.options ?? []), ...(q.columns ?? [])].some((o) => !o.label.trim()))
          bad("A row or column has no label.");
      }
      const v = q.validation;
      if (v?.min !== undefined && v.max !== undefined && v.min > v.max)
        bad("The minimum is above the maximum.");
      if (v?.minLength !== undefined && v.maxLength !== undefined && v.minLength > v.maxLength)
        bad("The minimum length is above the maximum.");
      if (
        v?.minSelected !== undefined &&
        v.maxSelected !== undefined &&
        v.minSelected > v.maxSelected
      )
        bad("The minimum number of options is above the maximum.");
      if (v?.pattern) {
        try {
          new RegExp(v.pattern);
        } catch {
          bad("The pattern is not a valid expression.");
        }
      }
      logic(q.showIf, at);
      before.add(q.id);
    }
  }
  return out;
}

/* ---------------------------------------------------------------- Summary */

export interface SummaryBucket {
  id: string;
  label: string;
  count: number;
  /** Of the answers to the question, 0 to 1. */
  share: number;
  /** Ranking: the mean place, 1 being first. */
  meanRank?: number;
}

export interface QuestionSummary {
  question: FormQuestion;
  kind: "choices" | "histogram" | "texts" | "matrix" | "ranking" | "count";
  /** Responses that were shown the question. */
  asked: number;
  answered: number;
  skipped: number;
  /** `answered / asked`, 0 to 1. */
  rate: number;
  buckets: SummaryBucket[];
  mean?: number;
  median?: number;
  nps?: { promoters: number; passives: number; detractors: number; score: number };
  /** Text answers, newest first when the responses are dated. */
  texts?: string[];
  matrix?: { rows: Array<{ id: string; label: string; counts: number[] }>; columns: FormOption[] };
}

export interface FormSummary {
  responses: number;
  /** The share of responses that answered every required question shown to them, 0 to 1. */
  completion: number;
  questions: QuestionSummary[];
}

const round = (n: number, digits = 2) => Math.round(n * 10 ** digits) / 10 ** digits;

const median = (values: number[]) => {
  if (!values.length) return undefined;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
};

function numericBuckets(q: FormQuestion, values: number[]): SummaryBucket[] {
  const total = values.length || 1;
  if (q.type === "rating" || q.type === "scale") {
    const r = q.range ?? { min: 1, max: 5 };
    const out: SummaryBucket[] = [];
    for (let v = r.min; v <= r.max; v += 1) {
      const count = values.filter((x) => x === v).length;
      out.push({ id: String(v), label: String(v), count, share: count / total });
    }
    return out;
  }
  if (!values.length) return [];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  if (lo === hi) return [{ id: String(lo), label: String(lo), count: values.length, share: 1 }];
  const bins = Math.min(8, Math.max(2, Math.ceil(Math.sqrt(values.length))));
  const width = (hi - lo) / bins;
  return Array.from({ length: bins }, (_, i) => {
    const from = lo + i * width;
    const to = i === bins - 1 ? hi : from + width;
    const count = values.filter((x) => x >= from && (i === bins - 1 ? x <= to : x < to)).length;
    return {
      id: `bin${i}`,
      label: `${round(from, 1)}–${round(to, 1)}`,
      count,
      share: count / total,
    };
  });
}

/** Sums the responses up question by question. Conditional logic is honoured: a question is only
 *  counted for the responses that were shown it. */
export function summarizeForm(
  schema: FormSchema,
  responses: ReadonlyArray<FormResponse>,
): FormSummary {
  const seen = responses.map((r) => formVisibility(schema, r.answers));
  const questions: QuestionSummary[] = formQuestions(schema).map((q): QuestionSummary => {
    const asked = responses.filter((_, i) => seen[i]!.questions[q.id]);
    const given = asked
      .map((r) => ({ r, a: r.answers[q.id] }))
      .filter(({ a }) => !isFormAnswerEmpty(q, a));
    const answers = given.map(({ a }) => a as FormAnswer);
    const base = {
      question: q,
      asked: asked.length,
      answered: answers.length,
      skipped: asked.length - answers.length,
      rate: asked.length ? answers.length / asked.length : 0,
    };
    const total = answers.length || 1;
    if (isChoiceType(q.type)) {
      const counts = new Map<string, number>();
      for (const a of answers)
        for (const id of Array.isArray(a) ? (a as string[]) : [a as string])
          counts.set(id, (counts.get(id) ?? 0) + 1);
      return {
        ...base,
        kind: "choices",
        buckets: (q.options ?? []).map((o) => ({
          id: o.id,
          label: o.label,
          count: counts.get(o.id) ?? 0,
          share: (counts.get(o.id) ?? 0) / total,
        })),
      };
    }
    if (q.type === "rating" || q.type === "scale" || q.type === "number") {
      const values = answers.filter((a): a is number => typeof a === "number");
      const out: QuestionSummary = {
        ...base,
        kind: "histogram",
        buckets: numericBuckets(q, values),
      };
      if (values.length) {
        out.mean = round(values.reduce((a, b) => a + b, 0) / values.length);
        const med = median(values);
        if (med !== undefined) out.median = med;
      }
      if (q.type === "scale" && q.range?.nps) {
        const promoters = values.filter((v) => v >= 9).length;
        const detractors = values.filter((v) => v <= 6).length;
        out.nps = {
          promoters,
          passives: values.length - promoters - detractors,
          detractors,
          score: values.length ? Math.round(((promoters - detractors) / values.length) * 100) : 0,
        };
      }
      return out;
    }
    if (q.type === "ranking") {
      const items = q.options ?? [];
      const points = new Map<string, number>();
      const places = new Map<string, number[]>();
      for (const a of answers as string[][]) {
        a.forEach((id, i) => {
          points.set(id, (points.get(id) ?? 0) + (items.length - i));
          places.set(id, [...(places.get(id) ?? []), i + 1]);
        });
      }
      const sum = [...points.values()].reduce((a, b) => a + b, 0) || 1;
      const buckets = items
        .map((o): SummaryBucket => {
          const p = places.get(o.id) ?? [];
          return {
            id: o.id,
            label: o.label,
            count: points.get(o.id) ?? 0,
            share: (points.get(o.id) ?? 0) / sum,
            ...(p.length ? { meanRank: round(p.reduce((a, b) => a + b, 0) / p.length) } : {}),
          };
        })
        .sort((a, b) => b.count - a.count);
      return { ...base, kind: "ranking", buckets };
    }
    if (q.type === "matrix") {
      const rows = (q.options ?? []).map((row) => ({
        id: row.id,
        label: row.label,
        counts: (q.columns ?? []).map(
          (col) =>
            answers.filter((a) => {
              const x = (a as FormMatrixAnswer)[row.id];
              return Array.isArray(x) ? x.includes(col.id) : x === col.id;
            }).length,
        ),
      }));
      return { ...base, kind: "matrix", buckets: [], matrix: { rows, columns: q.columns ?? [] } };
    }
    if (q.type === "shortText" || q.type === "longText" || q.type === "time" || q.type === "date") {
      const dated = given.every(({ r }) => r.submittedAt);
      const ordered = dated
        ? [...given].sort((a, b) => (b.r.submittedAt ?? "").localeCompare(a.r.submittedAt ?? ""))
        : given;
      return {
        ...base,
        kind: "texts",
        buckets: [],
        texts: ordered.map(({ a }) => String(a).trim()),
      };
    }
    if (q.type === "address") {
      return {
        ...base,
        kind: "texts",
        buckets: [],
        texts: given.map(({ a }) => formAnswerText(q, a)),
      };
    }
    return { ...base, kind: "count", buckets: [] };
  });
  const complete = responses.filter((_, i) =>
    formQuestions(schema).every(
      (q) =>
        !seen[i]!.questions[q.id] ||
        !q.required ||
        !isFormAnswerEmpty(q, responses[i]!.answers[q.id]),
    ),
  ).length;
  return {
    responses: responses.length,
    completion: responses.length ? complete / responses.length : 0,
    questions,
  };
}

/** `42 %`. */
export const formPercent = (share: number) => `${Math.round(share * 100)} %`;

export interface FormResponseGrid {
  columns: GridColumn[];
  rows: GridCell[][];
}

/**
 * The responses as the columns and rows of a DataGrid: one row per response, one column per
 * question (a hidden or skipped question is `null`), after a response column and a date.
 */
export function formResponseGrid(
  schema: FormSchema,
  responses: ReadonlyArray<FormResponse>,
): FormResponseGrid {
  const qs = formQuestions(schema);
  const seenNames = new Map<string, number>();
  const names = qs.map((q) => {
    const base = q.title.trim() || formQuestionInfo(q.type).label;
    const n = (seenNames.get(base) ?? 0) + 1;
    seenNames.set(base, n);
    return n === 1 ? base : `${base} (${n})`;
  });
  const numeric = (q: FormQuestion) =>
    q.type === "number" || q.type === "rating" || q.type === "scale";
  const columns: GridColumn[] = [
    { name: "Response", type: "id" },
    { name: "Submitted", type: "date" },
    ...qs.map((q, i): GridColumn => {
      const col: GridColumn = {
        name: names[i]!,
        type: formQuestionInfo(q.type).label.toLowerCase(),
      };
      if (numeric(q)) col.numeric = true;
      return col;
    }),
  ];
  const rows = responses.map((r): GridCell[] => {
    const seen = formVisibility(schema, r.answers);
    return [
      r.id,
      r.submittedAt ?? null,
      ...qs.map((q): GridCell => {
        const a = r.answers[q.id];
        if (!seen.questions[q.id] || isFormAnswerEmpty(q, a)) return null;
        return numeric(q) && typeof a === "number" ? a : formAnswerText(q, a);
      }),
    ];
  });
  return { columns, rows };
}
