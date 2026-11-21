import { FormRenderer, type FormSchema } from "@forgeron/ui";

// `layout="single"`: every section on one page, a progress bar that counts answers.
const schema: FormSchema = {
  version: 1,
  title: "Event registration",
  sections: [
    {
      id: "s1",
      title: "You",
      questions: [
        { id: "name", type: "shortText", title: "Name", required: true },
        { id: "time", type: "time", title: "Arrival time" },
        {
          id: "address",
          type: "address",
          title: "Postal address",
          help: "For the badge and the invoice.",
        },
      ],
    },
    {
      id: "s2",
      title: "Documents",
      questions: [
        {
          id: "files",
          type: "file",
          title: "Proof of employment",
          validation: { maxFiles: 2, maxSizeMb: 5, accept: ".pdf,image/*" },
        },
        { id: "sign", type: "signature", title: "Sign the code of conduct", required: true },
      ],
    },
  ],
};

const countries = [
  { value: "fr", label: "France" },
  { value: "be", label: "Belgium" },
  { value: "ch", label: "Switzerland" },
];

export default function SinglePage() {
  return <FormRenderer schema={schema} layout="single" countries={countries} />;
}
