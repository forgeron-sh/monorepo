import {
  FormBuilder,
  FormBuilderAddPage,
  FormBuilderEdit,
  FormBuilderMeta,
  FormBuilderPreview,
  FormBuilderProblems,
  FormBuilderSections,
  FormBuilderStatus,
  FormBuilderToolbar,
  type FormSchema,
} from "@forgeron/ui";
import { useState } from "react";

const initial: FormSchema = {
  version: 1,
  title: "Workshop feedback",
  description: "Two minutes, anonymous.",
  sections: [
    {
      id: "s1",
      title: "The day",
      questions: [
        {
          id: "q1",
          type: "rating",
          title: "How was it?",
          required: true,
          range: { min: 1, max: 5 },
        },
        { id: "q2", type: "longText", title: "What should we change?" },
      ],
    },
  ],
};

export default function Default() {
  const [schema, setSchema] = useState(initial);
  return (
    <div style={{ width: 760, maxWidth: "100%" }}>
      <FormBuilder value={schema} onChange={setSchema}>
        <FormBuilderToolbar />
        <FormBuilderEdit>
          <FormBuilderMeta />
          <FormBuilderProblems />
          <FormBuilderSections />
          <FormBuilderAddPage>Add a page</FormBuilderAddPage>
          <FormBuilderStatus />
        </FormBuilderEdit>
        <FormBuilderPreview />
      </FormBuilder>
    </div>
  );
}
