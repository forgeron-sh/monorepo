// A form built on one page: sections and their questions as cards, an add menu by type, drag or
// Alt + arrows to reorder (across sections too), show-if logic per question and per section with
// the ConditionBuilder, and a live preview that is the real FormRenderer. The value is the form
// schema, plain data to store and to hand to the renderer.

import { ArrowDown01Icon, ArrowUp01Icon, Delete04Icon, PlusSignIcon } from "@forgeron/icons";
import type { DragEvent } from "react";
import { useRef, useState } from "react";
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
  type FormQuestion,
  type FormSchema,
  type QuestionGroup,
  type QuestionType,
} from "./forms-model";

export interface FormBuilderProps {
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
  className?: string;
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
  className,
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

  const patchSection = (id: string, patch: Partial<FormSchema["sections"][number]>) =>
    setSchema({
      ...schema,
      sections: schema.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });

  const withoutKey = <T extends object, K extends keyof T>(o: T, key: K): Omit<T, K> => {
    const { [key]: _drop, ...rest } = o;
    return rest;
  };

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

  if (mode === "preview") {
    return (
      <div className={cx("fg-fm-builder", className)} role="group" aria-label={label}>
        <Toolbar mode={mode} setMode={setMode} problems={problems.length} />
        <div className="fg-fm-preview">
          <p className="fg-fm-preview-note">Preview. Answers are not saved.</p>
          <FormRenderer
            key={round}
            schema={schema}
            onSubmit={(answers) => onPreviewSubmit?.(answers)}
            {...(countries ? { countries } : {})}
          />
          <Button variant="ghost" size="sm" onClick={() => setRound(round + 1)}>
            Restart preview
          </Button>
        </div>
      </div>
    );
  }

  // The number of the first question of each page, counted across pages.
  const firstOf = schema.sections.map((_, i) =>
    schema.sections.slice(0, i).reduce((n, s) => n + s.questions.length, 0),
  );
  return (
    <div ref={root} className={cx("fg-fm-builder", className)} role="group" aria-label={label}>
      <Toolbar mode={mode} setMode={setMode} problems={problems.length} />
      <div className="fg-fm-meta">
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
      {problems
        .filter((p) => !p.questionId && !p.sectionId)
        .map((p) => (
          <p key={p.message} className="fg-fm-problem">
            {p.message}
          </p>
        ))}
      {schema.sections.map((section, si) => {
        const ordinal = firstOf[si]!;
        return (
          <section
            key={section.id}
            className="fg-fm-section-edit"
            aria-label={section.title || `Section ${si + 1}`}
          >
            <div className="fg-fm-section-head">
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
            </div>
            {section.description !== undefined || si > 0 ? (
              <Input
                aria-label={`Description of page ${si + 1}`}
                placeholder="Description (optional)"
                value={section.description ?? ""}
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
            ) : null}
            {si > 0 ? (
              <div className="fg-fm-section-logic">
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
            ) : null}
            <ul
              className="fg-fm-cards"
              aria-label={`Questions of page ${si + 1}`}
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
              {section.questions.length === 0 ? (
                <li className="fg-fm-cards-empty">No question on this page yet.</li>
              ) : null}
              {section.questions.map((q, qi) => {
                const own = problems.filter((p) => p.questionId === q.id).map((p) => p.message);
                return (
                  <li
                    key={q.id}
                    className={cx(
                      "fg-fm-card-slot",
                      dragging === q.id && "fg-fm-dragging",
                      over?.section === section.id && over.index === qi && "fg-fm-over-before",
                      over?.section === section.id &&
                        over.index === qi + 1 &&
                        qi === section.questions.length - 1 &&
                        "fg-fm-over-after",
                    )}
                    onDragOver={(event) => overItem(section.id, qi, event)}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (over) dropAt(over.section, over.index);
                    }}
                  >
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
                                showIf
                                  ? { ...cur, showIf }
                                  : (withoutKey(cur, "showIf") as FormQuestion),
                              ),
                            )
                          }
                        />
                      }
                    />
                  </li>
                );
              })}
            </ul>
            <ActionMenu
              label="Add a question"
              items={menu}
              onSelect={(type) => addQuestion(section.id, type as QuestionType)}
              trigger={
                <Button variant="secondary" size="sm" className="fg-fm-add">
                  <Icon icon={PlusSignIcon} size={12} variant="mono" />
                  Add question
                </Button>
              }
            />
          </section>
        );
      })}
      <Button variant="ghost" size="sm" className="fg-fm-add-section" onClick={addSection}>
        <Icon icon={PlusSignIcon} size={12} variant="mono" />
        Add page
      </Button>
      <span className="fg-sr" aria-live="polite">
        {said}
      </span>
    </div>
  );
}

function Toolbar({
  mode,
  setMode,
  problems,
}: {
  mode: "edit" | "preview";
  setMode: (m: "edit" | "preview") => void;
  problems: number;
}) {
  return (
    <div className="fg-fm-toolbar">
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
