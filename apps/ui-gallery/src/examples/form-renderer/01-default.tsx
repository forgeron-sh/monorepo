import {
  FormRenderer,
  FormRendererActions,
  FormRendererBack,
  FormRendererHeader,
  FormRendererNotice,
  FormRendererPages,
  FormRendererProgress,
  FormRendererSubmit,
  type FormSchema,
} from "@forgeron/ui";

const schema: FormSchema = {
  version: 1,
  title: "Quick poll",
  description: "One question per page.",
  thanks: "Thanks, noted.",
  sections: [
    {
      id: "s1",
      title: "",
      questions: [
        {
          id: "tool",
          type: "singleChoice",
          title: "Which tool do you open first?",
          required: true,
          options: [
            { id: "a", label: "The inbox" },
            { id: "b", label: "The board" },
          ],
        },
      ],
    },
    {
      id: "s2",
      title: "One more",
      questions: [{ id: "why", type: "longText", title: "Why?" }],
    },
  ],
};

export default function Default() {
  return (
    <div style={{ width: 560, maxWidth: "100%" }}>
      <FormRenderer schema={schema}>
        <FormRendererProgress />
        <FormRendererHeader />
        <FormRendererNotice />
        <FormRendererPages />
        <FormRendererActions>
          <FormRendererBack>Previous</FormRendererBack>
          <FormRendererSubmit />
        </FormRendererActions>
      </FormRenderer>
    </div>
  );
}
