import type { Atom } from "../types";

const className = { name: "className", type: "string", description: "Extra classes." } as const;

const schema = {
  name: "schema",
  type: "FormSchema",
  description:
    "{ version: 1, title, description?, sections: { id, title, description?, showIf?, questions: FormQuestion[] }[], submitLabel?, thanks? }. Plain data: store it as JSON.",
} as const;

const question = {
  name: "value / defaultValue",
  type: "FormQuestion",
  description:
    "{ id, type, title, help?, required?, placeholder?, options?, columns?, multiple?, range?, validation?, showIf? }. Controlled or not.",
} as const;

/** Gallery pages of the "forms" blocks, in order. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "form-builder",
    name: "Form builder",
    summary:
      "Build a form: pages and question cards, an add menu by type, drag or Alt + arrows to reorder, show-if logic, a live preview.",
    imports: [
      "FormBuilder",
      "emptyForm",
      "formProblems",
      "moveFormQuestion",
      "newFormQuestion",
      "formConditionFields",
      "FormBuilderToolbar",
      "FormBuilderEdit",
      "FormBuilderMeta",
      "FormBuilderProblems",
      "FormBuilderSections",
      "FormBuilderSection",
      "FormBuilderSectionHead",
      "FormBuilderSectionDescription",
      "FormBuilderSectionLogic",
      "FormBuilderCards",
      "FormBuilderCard",
      "FormBuilderAddQuestion",
      "FormBuilderAddPage",
      "FormBuilderStatus",
      "FormBuilderPreview",
      "useFormBuilder",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts, in the order you choose: FormBuilderToolbar, FormBuilderEdit (FormBuilderMeta, FormBuilderProblems, FormBuilderSections or your own FormBuilderSection with its head, logic, cards and add menu, FormBuilderAddPage, FormBuilderStatus) and FormBuilderPreview. Without them: the whole builder.",
      },
      {
        name: "value / defaultValue",
        type: "FormSchema",
        description:
          "The form: sections of questions, with options, limits and show-if rules. Controlled or not; `emptyForm()` is a blank one.",
      },
      { name: "onChange", type: "(schema: FormSchema) => void", description: "After every edit." },
      {
        name: "mode / defaultMode",
        type: `"edit" | "preview"`,
        default: `"edit"`,
        description:
          "The Edit / Preview switch. The preview is the real FormRenderer; nothing is saved.",
      },
      { name: "onModeChange", type: "(mode) => void", description: "When the switch moves." },
      {
        name: "onPreviewSubmit",
        type: "(answers: FormAnswers) => void",
        description: "Hears the answers sent in the preview.",
      },
      {
        name: "types",
        type: "QuestionType[]",
        description: "The types the add menu offers; all fifteen by default.",
      },
      {
        name: "countries",
        type: "{ value, label }[]",
        description: "Countries offered by address questions in the preview.",
      },
      {
        name: "label",
        type: "string",
        default: `"Form builder"`,
        description: "Names the builder for assistive technology.",
      },
      className,
    ],
  },
  {
    slug: "question-card",
    name: "Question card",
    summary:
      "One question edited where it stands: title, help, type, required, options, limits; duplicate, delete, a handle to reorder.",
    imports: [
      "QuestionCard",
      "newFormQuestion",
      "convertFormQuestion",
      "formQuestionInfo",
      "QuestionCardRow",
      "QuestionCardHandle",
      "QuestionCardSummary",
      "QuestionCardDuplicate",
      "QuestionCardDelete",
      "QuestionCardBody",
      "QuestionCardProblems",
      "QuestionCardFields",
      "QuestionCardChoices",
      "QuestionCardRange",
      "QuestionCardLimits",
      "QuestionCardLogic",
      "useQuestionCard",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts: QuestionCardRow (handle, summary, duplicate, delete) and QuestionCardBody (problems, fields, choices, range, limits, logic). Without them: both.",
      },
      question,
      {
        name: "onChange",
        type: "(question: FormQuestion) => void",
        description: "After every edit.",
      },
      {
        name: "index",
        type: "number",
        description: "Its number in the form, shown in the row.",
      },
      {
        name: "open / defaultOpen",
        type: "boolean",
        default: "false",
        description: "Shows the editor under the row. Controlled or not, with onOpenChange.",
      },
      {
        name: "onDuplicate / onDelete",
        type: "() => void",
        description: "The two buttons at the end of the row.",
      },
      {
        name: "onMove",
        type: "(delta: -1 | 1) => void",
        description:
          "Alt + Up and Alt + Down on the row, and the grip. Absent: no handle, no reordering.",
      },
      {
        name: "onDragStart / onDragEnd",
        type: "() => void",
        description:
          "Makes the handle draggable; the parent owns the drop targets (FormBuilder does).",
      },
      {
        name: "problems",
        type: "string[]",
        description:
          "What is wrong, shown above the editor and counted in the row. See `formProblems`.",
      },
      {
        name: "logic",
        type: "ReactNode",
        description:
          "A slot under the limits: the show-if of the question. The card knows nothing of the others.",
      },
      { name: "hasLogic", type: "boolean", description: "Marks the row with Logic." },
      {
        name: "takenIds",
        type: "string[]",
        description: "Every id of the form, so the options made here never collide.",
      },
      { name: "readOnly", type: "boolean", description: "Text only, no controls." },
      className,
    ],
  },
  {
    slug: "form-renderer",
    name: "Form renderer",
    summary:
      "A form schema as the form a respondent fills in: sections as pages, progress, messages, conditional questions, a review step.",
    imports: [
      "FormRenderer",
      "FormQuestionField",
      "validateFormAnswers",
      "cleanFormAnswers",
      "formVisibility",
      "formPages",
      "parseFormAnswer",
      "formAnswerText",
      "FormRendererHeader",
      "FormRendererProgress",
      "FormRendererNotice",
      "FormRendererPages",
      "FormRendererPage",
      "FormRendererQuestion",
      "FormRendererReview",
      "FormRendererActions",
      "FormRendererBack",
      "FormRendererSubmit",
      "FormQuestionFieldTitle",
      "FormQuestionFieldHelp",
      "FormQuestionFieldControl",
      "FormQuestionFieldError",
      "useFormRenderer",
      "useFormQuestionField",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts, in the order you choose: header, progress, notice, pages (or your own FormRendererPage with FormRendererQuestion), actions (back, submit). FormQuestionField takes FormQuestionFieldTitle, Help, Control and Error the same way. Without them: the whole form.",
      },
      schema,
      {
        name: "value / defaultValue",
        type: "FormAnswers",
        description:
          "The answers by question id: text as a string, a choice as an option id, a number, a list of ids, a matrix as { rowId: columnId }, an address, files, a signature. Controlled or not.",
      },
      {
        name: "onChange",
        type: "(answers: FormAnswers) => void",
        description: "After every answer.",
      },
      {
        name: "onSubmit",
        type: "(answers: FormAnswers) => void | Promise<void>",
        description:
          "Called once the form is complete, with the answers of the questions shown, trimmed, hidden ones left out. The thanks screen shows when it resolves.",
      },
      {
        name: "layout",
        type: `"pages" | "single"`,
        default: `"pages"`,
        description: "One section at a time with a progress bar, or every section on one page.",
      },
      {
        name: "review",
        type: "boolean",
        description:
          "A last step that lists the answers, each page with an Edit button. On when there is more than one page.",
      },
      {
        name: "page / defaultPage / onPageChange",
        type: "number",
        description: "The step shown, from 0; the review comes after the last page.",
      },
      {
        name: "countries",
        type: "{ value, label }[]",
        description: "Countries offered by address questions.",
      },
      {
        name: "showTitle",
        type: "boolean",
        default: "true",
        description: "The title and description above the first page.",
      },
      {
        name: "headingLevel",
        type: "1 | 2 | 3",
        default: "2",
        description: "The level of the title; pages are one lower.",
      },
      {
        name: "submitted",
        type: "boolean",
        description: "Shows the thanks screen; controlled when given.",
      },
      { name: "thanks", type: "ReactNode", description: "In place of `schema.thanks`." },
      { name: "disabled", type: "boolean", description: "Locks every control." },
      className,
    ],
  },
  {
    slug: "matrix-field",
    name: "Matrix field",
    summary:
      "Rows rated against the same columns: one radio (or box) per cell, named by its row and column.",
    imports: [
      "MatrixField",
      "MatrixFieldColumns",
      "MatrixFieldRows",
      "MatrixFieldRow",
      "MatrixFieldCell",
      "useMatrixField",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts inside the table: MatrixFieldColumns and MatrixFieldRows (or your own MatrixFieldRow with MatrixFieldCell). Without them: both.",
      },
      {
        name: "label",
        type: "string",
        description: "Names the matrix for assistive technology: the question.",
      },
      {
        name: "rows / columns",
        type: "{ id, label }[]",
        description: "What is rated, and the scale it is rated on.",
      },
      {
        name: "value / defaultValue",
        type: "Record<rowId, columnId | columnId[]>",
        description: "The chosen column of each row. Controlled or not.",
      },
      { name: "onChange", type: "(value) => void", description: "After every choice." },
      {
        name: "multiple",
        type: "boolean",
        default: "false",
        description: "Several columns may be chosen on a row.",
      },
      {
        name: "invalid / describedBy",
        type: "boolean / string",
        description: "Ties the matrix to its error.",
      },
      { name: "disabled", type: "boolean", description: "Locks the matrix." },
      className,
    ],
  },
  {
    slug: "ranking-field",
    name: "Ranking field",
    summary:
      "Items put in order: drag the handle, press the arrow buttons, or Alt + Up and Alt + Down on an item.",
    imports: [
      "RankingField",
      "moveFormItem",
      "RankingFieldList",
      "RankingFieldItem",
      "RankingFieldHandle",
      "RankingFieldMain",
      "RankingFieldUp",
      "RankingFieldDown",
      "RankingFieldKeep",
      "RankingFieldStatus",
      "useRankingField",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts: RankingFieldList (RankingFieldItem with its handle, main, up and down), RankingFieldKeep, RankingFieldStatus. Without them: all three.",
      },
      {
        name: "label",
        type: "string",
        description: "Names the list for assistive technology: the question.",
      },
      {
        name: "items",
        type: "{ id, label }[]",
        description: "What is ranked, in the order shown at first.",
      },
      {
        name: "value / defaultValue",
        type: "string[] | null",
        description:
          "The item ids in the chosen order. `null` until the respondent orders them: the list is dimmed and Keep this order accepts it.",
      },
      {
        name: "onChange",
        type: "(ids: string[] | null) => void",
        description: "After every move.",
      },
      {
        name: "invalid / describedBy",
        type: "boolean / string",
        description: "Ties the list to its error.",
      },
      { name: "disabled", type: "boolean", description: "Locks the list." },
      className,
    ],
  },
  {
    slug: "response-summary",
    name: "Response summary",
    summary:
      "What came back, one mini-chart per question: bars, histogram with mean and NPS, list of texts, matrix grid.",
    imports: [
      "ResponseSummary",
      "summarizeForm",
      "formResponseGrid",
      "formPercent",
      "ResponseSummaryTotals",
      "ResponseSummaryEmpty",
      "ResponseSummaryList",
      "ResponseSummaryQuestion",
      "ResponseSummaryQuestionHead",
      "ResponseSummaryQuestionMeta",
      "ResponseSummaryQuestionBody",
      "useResponseSummary",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts: totals, the empty note, and the list (or your own ResponseSummaryQuestion by index). Without them: all three.",
      },
      schema,
      {
        name: "responses",
        type: "{ id, submittedAt?, answers }[]",
        description:
          "One per respondent. A conditional question is counted only for the responses that were shown it.",
      },
      {
        name: "label",
        type: "string",
        default: `"Responses"`,
        description: "Names the summary for assistive technology.",
      },
      {
        name: "textLimit",
        type: "number",
        default: "4",
        description: "How many text answers show before Show all.",
      },
      className,
    ],
  },
  {
    slug: "share-link-panel",
    name: "Share link panel",
    summary:
      "The link of a form to copy, the embed code, and a switch that stops taking responses.",
    imports: [
      "ShareLinkPanel",
      "ShareLinkPanelLink",
      "ShareLinkPanelEmbed",
      "ShareLinkPanelSwitch",
      "ShareLinkPanelClosed",
      "useShareLinkPanel",
    ],
    props: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "The parts: the link, the embed snippet, the switch and the closed note. Without them: all of them (the snippet unless `embed` is false).",
      },
      { name: "url", type: "string", description: "The public address of the form." },
      {
        name: "open / defaultOpen",
        type: "boolean",
        default: "true",
        description: "Whether the form takes responses. Controlled or not, with onOpenChange.",
      },
      {
        name: "embed",
        type: "boolean",
        default: "true",
        description: "An iframe snippet under the link.",
      },
      { name: "closedMessage", type: "string", description: "Said when the form is closed." },
      className,
    ],
  },
];
