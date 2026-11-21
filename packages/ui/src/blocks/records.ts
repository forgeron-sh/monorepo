// The records model under the list views, and the generic views built on it: describe the fields of
// a record once (`defineFields`), then get a list, a board, filters, display options and property
// pickers from them. `issueFields` and `projectFields` are the two presets.

export { defineFields, RECORD_BOOLEAN_CHOICES, RECORD_NONE } from "./records-model";
export type {
  RecordChoiceSet,
  RecordFieldChoice,
  RecordFieldDef,
  RecordFieldDefs,
  RecordFieldKind,
  RecordFieldPlace,
  RecordFieldValue,
  RecordContext,
  RecordFields,
} from "./records-model";
export {
  defaultProperties,
  displayProperties,
  RecordFieldMark,
  RecordFieldPicker,
  fieldOptions,
  filterFields,
  groupingOptions,
  orderingOptions,
  propertyRows,
  RecordPickers,
  recordGroups,
  withGlyphs,
} from "./records-fields";
export type {
  RecordFieldMarkProps,
  RecordFieldPickerProps,
  RecordEditor,
  RecordEditorRender,
  RecordEditors,
  RecordGroup,
  RecordPropertiesProps,
} from "./records-fields";
export { RecordFieldSlot, useRecordSurface } from "./records-surface";
export type {
  RecordEditingProps,
  RecordItem,
  RecordSurfaceProps,
  Surface,
} from "./records-surface";
export { RecordList, RecordRow } from "./records-list";
export type { RecordListProps } from "./records-list";
export { RecordBoard, RecordCard } from "./records-board";
export type { RecordBoardProps } from "./records-board";
export { useRecordView } from "./records-view";
export type { RecordView } from "./records-view";
export { PROJECT_HEALTHS, PROJECT_STATUSES, projectFields } from "./records-projects";
