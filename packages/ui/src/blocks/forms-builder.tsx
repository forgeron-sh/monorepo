// A form built on one page: sections and their questions as cards, an add menu by type, drag or
// Alt + arrows to reorder (across sections too), show-if logic per question and per section with
// the ConditionBuilder, and a live preview that is the real FormRenderer. The value is the form
// schema, plain data to store and to hand to the renderer.
//
// With props it is the whole builder; with children you place the parts:
//
//   <FormBuilder value={schema} onChange={setSchema}>
//     <FormBuilderToolbar />
//     <FormBuilderEdit>
//       <FormBuilderMeta />
//       <FormBuilderSections />
//       <FormBuilderAddPage />
//     </FormBuilderEdit>
//     <FormBuilderPreview />
//   </FormBuilder>

import { ArrowDown01Icon, ArrowUp01Icon, Delete04Icon, PlusSignIcon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ComponentProps,
  type DragEvent,
  type ReactNode,
} from "react";
import { Button } from "../button";
import { Segmented } from "../controls";
import { cx } from "../cx";
import { Field, Input } from "../form";
import { useControllableState } from "../hooks/use-controllable";
import { sortableDropPosition, sortableSlotIndex } from "../sortable-model";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { ConditionBuilder, emptyCondition } from "../condition-builder";
import type { ConditionGroup } from "./automation-model";
import { ActionMenu, type ActionMenuEntry } from "../action-menu";
import { partContext } from "../part";
import { QuestionCard } from "./forms-question-card";
import { FormRenderer } from "./forms-renderer";
import {
  FORM_GROUP_NAMES,
  FORM_QUESTION_TYPES,
  duplicateFormQuestion,
  emptyForm,
  formAllIds,
  formConditionFields,
  formProblems,
  formQuestionInfo,
  freshFormId,
  moveFormQuestion,
  moveFormQuestionTo,
  moveFormSection,
  newFormQuestion,
  newFormSection,
  pruneFormLogic,
  removeFormQuestion,
  updateFormQuestion,
  type FormAnswers,
  type FormProblem,
  type FormQuestion,
  type FormSchema,
  type FormSection,
  type QuestionGroup,
  type QuestionType,
} from "./forms-model";

export interface FormBuilderProps extends Omit<
  ComponentProps<"div">,
  "ref" | "onChange" | "defaultValue" | "role"
> {
  /** The form. Controlled or not. */
  value?: FormSchema;
  defaultValue?: FormSchema;
  onChange?: (schema: FormSchema) => void;
  /** `edit` or `preview`. Controlled or not. */
  mode?: "edit" | "preview";
  defaultMode?: "edit" | "preview";
  onModeChange?: (mode: "edit" | "preview") => void;
  /** The answers sent in the preview; nothing is stored. */
  onPreviewSubmit?: (answers: FormAnswers) => void;
  /** Countries offered by address questions in the preview. */
  countries?: ReadonlyArray<{ value: string; label: string }>;
  /** Names the builder for assistive technology. Default "Form builder". */
  label?: string;
  /** The types of question the add menu offers; all by default. */
  types?: ReadonlyArray<QuestionType>;
  /** The parts, in the order you choose. Without them: toolbar, edit view and preview. */
  children?: ReactNode;
}

const GROUPS: ReadonlyArray<QuestionGroup> = [
  "text",
  "choice",
  "number",
  "date",
  "rating",
  "structured",
  "upload",
];

const questionName = (q: FormQuestion) => q.title.trim() || formQuestionInfo(q.type).label;

/** Show-if of a question or a section: a ConditionBuilder over the questions before it. */
function Logic({
  fields,
  value,
  onChange,
  noun,
}: {
  fields: ReturnType<typeof formConditionFields>;
  value: ConditionGroup | undefined;
  onChange: (next: ConditionGroup | undefined) => void;
  noun: string;
}) {
  if (!value) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={fields.length === 0}
        onClick={() => onChange(emptyCondition())}
        title={
          fields.length === 0 ? "Add a question before this one to read its answer" : undefined
        }
      >
        <Icon icon={PlusSignIcon} size={12} variant="mono" />
        Show this {noun} only if…
      </Button>
    );
  }
  return (
    <div className="fg-fm-logic">
      <div className="fg-fm-logic-head">
        <span className="fg-field-label">Show this {noun} only if</span>
        <Button variant="ghost" size="sm" onClick={() => onChange(undefined)}>
          Remove rule
        </Button>
      </div>
      <ConditionBuilder
        label={`Show-if rules of this ${noun}`}
        value={value}
        onChange={onChange}
        fields={fields}
        maxDepth={1}
      />
    </div>
  );
}

interface BuilderContext {
  schema: FormSchema;
  setSchema: (next: FormSchema) => void;
  mode: "edit" | "preview";
  setMode: (mode: "edit" | "preview") => void;
  problems: FormProblem[];
  ids: string[];
  menu: ActionMenuEntry[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
  dragging: string | null;
  setDragging: (id: string | null) => void;
  over: { section: string; index: number } | null;
  setOver: (over: { section: string; index: number } | null) => void;
  said: string;
  setSaid: (said: string) => void;
  round: number;
  restart: () => void;
  countries: ReadonlyArray<{ value: string; label: string }> | undefined;
  onPreviewSubmit: ((answers: FormAnswers) => void) | undefined;
  addQuestion: (sectionId: string, type: QuestionType) => void;
  addSection: () => void;
  removeSection: (id: string) => void;
  patchSection: (id: string, patch: Partial<FormSection>) => void;
  move: (id: string, delta: -1 | 1) => void;
  dropAt: (sectionId: string, index: number) => void;
  overItem: (sectionId: string, index: number, event: DragEvent<HTMLElement>) => void;
}

const [BuilderCtx, useFormBuilder] = partContext<BuilderContext>("FormBuilder");

/** The state of the enclosing `FormBuilder`: the schema, the mode, the problems, the drag. */
export { useFormBuilder };

const withoutKey = <T extends object, K extends keyof T>(o: T, key: K): Omit<T, K> => {
  const { [key]: _drop, ...rest } = o;
  return rest;
};

/** The mode switch and what is left to fix. */
export function FormBuilderToolbar({ className, ...rest }: { className?: string }) {
  const { mode, setMode, problems } = useFormBuilder();
  return (
    <BuilderToolbar
      mode={mode}
      setMode={setMode}
      problems={problems.length}
      className={className}
      {...rest}
    />
  );
}

/** The title and the description of the form. */
export function FormBuilderMeta({ className, ...rest }: Omit<ComponentProps<"div">, "ref">) {
  const { schema, setSchema } = useFormBuilder();
  return (
    <div data-slot="form-builder-meta" {...rest} className={cx("fg-fm-meta", className)}>
      <Field label="Form title">
        {(control) => (
          <Input
            {...control}
            value={schema.title}
            onChange={(event) => setSchema({ ...schema, title: event.target.value })}
          />
        )}
      </Field>
      <Field label="Description">
        {(control) => (
          <Input
            {...control}
            value={schema.description ?? ""}
            onChange={(event) =>
              setSchema(
                event.target.value
                  ? { ...schema, description: event.target.value }
                  : (withoutKey(schema, "description") as FormSchema),
              )
            }
          />
        )}
      </Field>
    </div>
  );
}

/** The problems of the form as a whole (not of one question or page). */
export function FormBuilderProblems() {
  const { problems } = useFormBuilder();
  return (
    <>
      {problems
        .filter((p) => !p.questionId && !p.sectionId)
        .map((p) => (
          <p key={p.message} data-slot="form-builder-problem" className="fg-fm-problem">
            {p.message}
          </p>
        ))}
    </>
  );
}

interface SectionContext {
  section: FormSection;
  /** Its place among the pages, from 0. */
  index: number;
  /** How many questions come before the page. */
  ordinal: number;
}

const SectionCtx = createContext<SectionContext | null>(null);

function useBuilderSection(part: string): SectionContext & BuilderContext {
  const section = useContext(SectionCtx);
  if (!section) throw new Error(`<${part}> goes inside a <FormBuilderSection>.`);
  return { ...section, ...useFormBuilder() };
}

/** The title of a page, its place, and the buttons to move or delete it. */
export function FormBuilderSectionHead({
  className,
  children,
  ...rest
}: Omit<ComponentProps<"div">, "ref">) {
  const {
    schema,
    setSchema,
    section,
    index: si,
    patchSection,
    removeSection,
  } = useBuilderSection("FormBuilderSectionHead");
  return (
    <div
      data-slot="form-builder-section-head"
      {...rest}
      className={cx("fg-fm-section-head", className)}
    >
      {children ?? (
        <>
          <span className="fg-fm-section-n">Page {si + 1}</span>
          <Input
            className="fg-fm-section-title"
            aria-label={`Title of page ${si + 1}`}
            placeholder="Page title (optional)"
            value={section.title}
            onChange={(event) => patchSection(section.id, { title: event.target.value })}
          />
          <IconButton
            icon={ArrowUp01Icon}
            size="sm"
            label={`Move page ${si + 1} up`}
            disabled={si === 0}
            onClick={() => setSchema(moveFormSection(schema, section.id, -1))}
          />
          <IconButton
            icon={ArrowDown01Icon}
            size="sm"
            label={`Move page ${si + 1} down`}
            disabled={si === schema.sections.length - 1}
            onClick={() => setSchema(moveFormSection(schema, section.id, 1))}
          />
          <IconButton
            icon={Delete04Icon}
            size="sm"
            label={`Delete page ${si + 1}`}
            disabled={schema.sections.length <= 1}
            onClick={() => removeSection(section.id)}
          />
        </>
      )}
    </div>
  );
}

/** The description of a page: shown for every page but a first one that has none. */
export function FormBuilderSectionDescription(props: { className?: string }) {
  const {
    schema,
    setSchema,
    section,
    index: si,
  } = useBuilderSection("FormBuilderSectionDescription");
  if (section.description === undefined && si === 0) return null;
  return (
    <Input
      data-slot="form-builder-section-description"
      aria-label={`Description of page ${si + 1}`}
      placeholder="Description (optional)"
      value={section.description ?? ""}
      {...props}
      onChange={(event) =>
        setSchema({
          ...schema,
          sections: schema.sections.map((s) =>
            s.id !== section.id
              ? s
              : event.target.value
                ? { ...s, description: event.target.value }
                : (withoutKey(s, "description") as typeof s),
          ),
        })
      }
    />
  );
}

/** The show-if of a page: never on the first. */
export function FormBuilderSectionLogic({
  className,
  ...rest
}: Omit<ComponentProps<"div">, "ref">) {
  const { schema, setSchema, section, index: si } = useBuilderSection("FormBuilderSectionLogic");
  if (si === 0) return null;
  return (
    <div
      data-slot="form-builder-section-logic"
      {...rest}
      className={cx("fg-fm-section-logic", className)}
    >
      <Logic
        noun="page"
        fields={formConditionFields(schema, section.id)}
        value={section.showIf}
        onChange={(showIf) =>
          setSchema({
            ...schema,
            sections: schema.sections.map((s) =>
              s.id !== section.id
                ? s
                : showIf
                  ? { ...s, showIf }
                  : (withoutKey(s, "showIf") as typeof s),
            ),
          })
        }
      />
    </div>
  );
}

export interface FormBuilderCardProps extends Omit<ComponentProps<"li">, "ref" | "children"> {
  /** The question of the page this card is for. */
  question: FormQuestion;
  /** The card in the slot. Default: the `QuestionCard` wired to the builder. */
  children?: ReactNode;
}

/** One slot of the list: a question card that can be dragged to another place. */
export function FormBuilderCard({
  question: q,
  className,
  children,
  ...rest
}: FormBuilderCardProps) {
  const ctx = useBuilderSection("FormBuilderCard");
  const {
    schema,
    setSchema,
    section,
    ordinal,
    problems,
    ids,
    openId,
    setOpenId,
    dragging,
    setDragging,
    over,
    setOver,
    setSaid,
    move,
    dropAt,
    overItem,
  } = ctx;
  const qi = section.questions.findIndex((x) => x.id === q.id);
  const own = problems.filter((p) => p.questionId === q.id).map((p) => p.message);
  return (
    <li
      data-slot="form-builder-card"
      {...rest}
      className={cx(
        "fg-fm-card-slot",
        dragging === q.id && "fg-fm-dragging",
        over?.section === section.id && over.index === qi && "fg-fm-over-before",
        over?.section === section.id &&
          over.index === qi + 1 &&
          qi === section.questions.length - 1 &&
          "fg-fm-over-after",
        className,
      )}
      onDragOver={(event) => overItem(section.id, qi, event)}
      onDrop={(event) => {
        event.preventDefault();
        if (over) dropAt(over.section, over.index);
      }}
    >
      {children ?? (
        <QuestionCard
          value={q}
          onChange={(next) => {
            const updated = updateFormQuestion(schema, q.id, () => next);
            setSchema(next.type === q.type ? updated : pruneFormLogic(updated));
          }}
          index={ordinal + qi + 1}
          open={openId === q.id}
          onOpenChange={(open) => setOpenId(open ? q.id : null)}
          onDuplicate={() => {
            setSchema(duplicateFormQuestion(schema, q.id));
            setSaid("Question duplicated");
          }}
          onDelete={() => {
            setSchema(removeFormQuestion(schema, q.id));
            setSaid(`${questionName(q)} deleted`);
          }}
          onMove={(delta) => move(q.id, delta)}
          onDragStart={() => setDragging(q.id)}
          onDragEnd={() => {
            setDragging(null);
            setOver(null);
          }}
          problems={own}
          takenIds={ids}
          hasLogic={Boolean(q.showIf)}
          logic={
            <Logic
              noun="question"
              fields={formConditionFields(schema, q.id)}
              value={q.showIf}
              onChange={(showIf) =>
                setSchema(
                  updateFormQuestion(schema, q.id, (cur) =>
                    showIf ? { ...cur, showIf } : (withoutKey(cur, "showIf") as FormQuestion),
                  ),
                )
              }
            />
          }
        />
      )}
    </li>
  );
}

/** The questions of a page, a card each, and the drop zone behind them. */
export function FormBuilderCards({
  className,
  children,
  ...rest
}: Omit<ComponentProps<"ul">, "ref">) {
  const {
    section,
    index: si,
    dragging,
    over,
    setOver,
    dropAt,
  } = useBuilderSection("FormBuilderCards");
  return (
    <ul
      data-slot="form-builder-cards"
      aria-label={`Questions of page ${si + 1}`}
      {...rest}
      className={cx("fg-fm-cards", className)}
      onDragOver={(event) => {
        if (!dragging || event.target !== event.currentTarget) return;
        event.preventDefault();
        setOver({ section: section.id, index: section.questions.length });
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (over?.section === section.id) dropAt(section.id, over.index);
      }}
    >
      {children ?? (
        <>
          {section.questions.length === 0 ? (
            <li className="fg-fm-cards-empty">No question on this page yet.</li>
          ) : null}
          {section.questions.map((q) => (
            <FormBuilderCard key={q.id} question={q} />
          ))}
        </>
      )}
    </ul>
  );
}

/** The "Add question" menu of a page, by type of question. */
export function FormBuilderAddQuestion({ children = "Add question" }: { children?: ReactNode }) {
  const { section, menu, addQuestion } = useBuilderSection("FormBuilderAddQuestion");
  return (
    <ActionMenu
      label="Add a question"
      items={menu}
      onSelect={(type) => addQuestion(section.id, type as QuestionType)}
      trigger={
        <Button
          variant="secondary"
          size="sm"
          className="fg-fm-add"
          data-slot="form-builder-add-question"
        >
          <Icon icon={PlusSignIcon} size={12} variant="mono" />
          {children}
        </Button>
      }
    />
  );
}

export interface FormBuilderSectionProps extends Omit<ComponentProps<"section">, "ref"> {
  /** The page. */
  section: FormSection;
}

/** One page of the form. Its children replace the head, the logic, the cards and the add menu. */
export function FormBuilderSection({
  section,
  className,
  children,
  ...rest
}: FormBuilderSectionProps) {
  const { schema } = useFormBuilder();
  const index = schema.sections.findIndex((s) => s.id === section.id);
  // The number of the first question of the page, counted across pages.
  const ordinal = schema.sections.slice(0, index).reduce((n, s) => n + s.questions.length, 0);
  return (
    <SectionCtx.Provider value={{ section, index, ordinal }}>
      <section
        data-slot="form-builder-section"
        aria-label={section.title || `Section ${index + 1}`}
        {...rest}
        className={cx("fg-fm-section-edit", className)}
      >
        {children ?? (
          <>
            <FormBuilderSectionHead />
            <FormBuilderSectionDescription />
            <FormBuilderSectionLogic />
            <FormBuilderCards />
            <FormBuilderAddQuestion />
          </>
        )}
      </section>
    </SectionCtx.Provider>
  );
}

/** The pages of the form, one `FormBuilderSection` each. */
export function FormBuilderSections() {
  const { schema } = useFormBuilder();
  return (
    <>
      {schema.sections.map((s) => (
        <FormBuilderSection key={s.id} section={s} />
      ))}
    </>
  );
}

/** "Add page". */
export function FormBuilderAddPage({
  children = "Add page",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  const { addSection } = useFormBuilder();
  return (
    <Button
      variant="ghost"
      size="sm"
      data-slot="form-builder-add-page"
      className={cx("fg-fm-add-section", className)}
      onClick={addSection}
    >
      <Icon icon={PlusSignIcon} size={12} variant="mono" />
      {children}
    </Button>
  );
}

/** What was last done, said to assistive technology: a move, a duplicate, a delete. */
export function FormBuilderStatus() {
  const { said } = useFormBuilder();
  return (
    <span data-slot="form-builder-status" className="fg-sr" aria-live="polite">
      {said}
    </span>
  );
}

/** Its children only in the `edit` mode. Without children: the whole edit view. */
export function FormBuilderEdit({ children }: { children?: ReactNode }) {
  const { mode } = useFormBuilder();
  if (mode !== "edit") return null;
  return (
    <>
      {children ?? (
        <>
          <FormBuilderMeta />
          <FormBuilderProblems />
          <FormBuilderSections />
          <FormBuilderAddPage />
          <FormBuilderStatus />
        </>
      )}
    </>
  );
}

/** Its children only in the `preview` mode. Without children: the real renderer. */
export function FormBuilderPreview({
  className,
  children,
  ...rest
}: Omit<ComponentProps<"div">, "ref">) {
  const { mode, schema, round, restart, onPreviewSubmit, countries } = useFormBuilder();
  if (mode !== "preview") return null;
  return (
    <div data-slot="form-builder-preview" {...rest} className={cx("fg-fm-preview", className)}>
      {children ?? (
        <>
          <p className="fg-fm-preview-note">Preview. Answers are not saved.</p>
          <FormRenderer
            key={round}
            schema={schema}
            onSubmit={(answers) => onPreviewSubmit?.(answers)}
            {...(countries ? { countries } : {})}
          />
          <Button variant="ghost" size="sm" onClick={restart}>
            Restart preview
          </Button>
        </>
      )}
    </div>
  );
}

/** Builds a form: sections, questions, logic, and the preview of what respondents will see. */
export function FormBuilder({
  value,
  defaultValue,
  onChange,
  mode: modeProp,
  defaultMode = "edit",
  onModeChange,
  onPreviewSubmit,
  countries,
  label = "Form builder",
  types,
  children,
  className,
  ...rest
}: FormBuilderProps) {
  const [schema, setSchema] = useControllableState<FormSchema>({
    value,
    defaultValue: defaultValue ?? emptyForm(),
    onChange,
  });
  const [mode, setMode] = useControllableState<"edit" | "preview">({
    value: modeProp,
    defaultValue: defaultMode,
    onChange: onModeChange,
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<{ section: string; index: number } | null>(null);
  const [said, setSaid] = useState("");
  const [round, setRound] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  const problems = formProblems(schema);
  const ids = formAllIds(schema);
  const offered = types
    ? FORM_QUESTION_TYPES.filter((t) => types.includes(t.type))
    : FORM_QUESTION_TYPES;

  const menu: ActionMenuEntry[] = GROUPS.flatMap((g) => {
    const rows = offered.filter((t) => t.group === g);
    return rows.length
      ? [
          { heading: FORM_GROUP_NAMES[g] },
          ...rows.map((t): ActionMenuEntry => ({ id: t.type, label: t.label, icon: t.icon })),
        ]
      : [];
  });

  const focusCard = (id: string) =>
    requestAnimationFrame(() =>
      root.current
        ?.querySelector<HTMLElement>(`[data-question="${CSS.escape(id)}"] .fg-fm-qc-main`)
        ?.focus(),
    );

  const addQuestion = (sectionId: string, type: QuestionType) => {
    const id = freshFormId("q", ids);
    const q = newFormQuestion(type, id, [...ids, id]);
    setSchema({
      ...schema,
      sections: schema.sections.map((s) =>
        s.id === sectionId ? { ...s, questions: [...s.questions, q] } : s,
      ),
    });
    setOpenId(id);
    focusCard(id);
  };

  const addSection = () => {
    const s = newFormSection(ids);
    setSchema({ ...schema, sections: [...schema.sections, s] });
  };

  const removeSection = (id: string) => {
    if (schema.sections.length <= 1) return;
    setSchema(pruneFormLogic({ ...schema, sections: schema.sections.filter((s) => s.id !== id) }));
  };

  const patchSection = (id: string, patch: Partial<FormSection>) =>
    setSchema({
      ...schema,
      sections: schema.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });

  const move = (id: string, delta: -1 | 1) => {
    const next = moveFormQuestion(schema, id, delta);
    if (next === schema) return;
    setSchema(next);
    const at = next.sections.flatMap((s, si) => s.questions.map((q, qi) => ({ q, si, qi })));
    const place = at.find((x) => x.q.id === id)!;
    setSaid(
      `${questionName(place.q)}, position ${place.qi + 1} of ${next.sections[place.si]!.questions.length}` +
        (next.sections.length > 1 ? `, section ${place.si + 1}` : ""),
    );
    focusCard(id);
  };

  const dropAt = (sectionId: string, index: number) => {
    if (dragging) {
      const from = schema.sections
        .flatMap((s) => s.questions.map((q) => [s.id, q.id] as const))
        .find(([, qid]) => qid === dragging);
      const fromIndex =
        schema.sections
          .find((s) => s.id === from?.[0])
          ?.questions.findIndex((q) => q.id === dragging) ?? -1;
      // Dropping below its own place lands one earlier once the card has left.
      const target = from?.[0] === sectionId ? sortableSlotIndex(fromIndex, index) : index;
      setSchema(moveFormQuestionTo(schema, dragging, sectionId, target));
    }
    setDragging(null);
    setOver(null);
  };

  const overItem = (sectionId: string, index: number, event: DragEvent<HTMLElement>) => {
    if (!dragging) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const box = event.currentTarget.getBoundingClientRect();
    const i =
      sortableDropPosition(event.clientY - box.top, box.height) === "after" ? index + 1 : index;
    if (over?.section !== sectionId || over.index !== i) setOver({ section: sectionId, index: i });
  };

  return (
    <BuilderCtx.Provider
      value={{
        schema,
        setSchema,
        mode,
        setMode,
        problems,
        ids,
        menu,
        openId,
        setOpenId,
        dragging,
        setDragging,
        over,
        setOver,
        said,
        setSaid,
        round,
        restart: () => setRound(round + 1),
        countries,
        onPreviewSubmit,
        addQuestion,
        addSection,
        removeSection,
        patchSection,
        move,
        dropAt,
        overItem,
      }}
    >
      <div
        ref={root}
        data-slot="form-builder"
        {...rest}
        className={cx("fg-fm-builder", className)}
        role="group"
        aria-label={label}
      >
        {children ?? (
          <>
            <FormBuilderToolbar />
            <FormBuilderEdit />
            <FormBuilderPreview />
          </>
        )}
      </div>
    </BuilderCtx.Provider>
  );
}

function BuilderToolbar({
  mode,
  setMode,
  problems,
  className,
}: {
  mode: "edit" | "preview";
  setMode: (m: "edit" | "preview") => void;
  problems: number;
  className?: string;
}) {
  return (
    <div data-slot="form-builder-toolbar" className={cx("fg-fm-toolbar", className)}>
      <Segmented
        label="Mode"
        options={[
          { value: "edit", label: "Edit" },
          { value: "preview", label: "Preview" },
        ]}
        value={mode}
        onChange={(next) => setMode(next as "edit" | "preview")}
      />
      {problems > 0 ? (
        <span className="fg-fm-toolbar-bad" role="status">
          {problems} {problems === 1 ? "problem" : "problems"} to fix
        </span>
      ) : (
        <span className="fg-fm-toolbar-ok" role="status">
          Ready to share
        </span>
      )}
    </div>
  );
}
