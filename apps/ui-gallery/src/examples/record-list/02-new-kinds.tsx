import { defineFields, RecordList, recordGroups } from "@forgeron/ui";

interface Contract {
  id: string;
  title: string;
  signed: boolean | null;
  client: string[];
  files: string[];
  terms: string | null;
}

const clients = [
  { value: "acme", label: "Acme" },
  { value: "bolt", label: "Bolt Logistics" },
];

/** The kinds `boolean`, `relation`, `file` and `json` of defineFields, in the same list. */
const fields = defineFields<Contract>({
  title: { label: "Title", kind: "text", get: (r) => r.title },
  signed: { label: "Signed", kind: "boolean", get: (r) => r.signed },
  client: { label: "Client", kind: "relation", get: (r) => r.client, options: clients },
  files: { label: "Files", kind: "file", get: (r) => r.files },
  terms: { label: "Terms", kind: "json", mono: true, get: (r) => r.terms },
});

const contracts: Contract[] = [
  {
    id: "C-1",
    title: "Supply agreement",
    signed: true,
    client: ["acme"],
    files: ["agreement.pdf"],
    terms: '{"net":30}',
  },
  {
    id: "C-2",
    title: "Transport framework",
    signed: false,
    client: ["bolt", "acme"],
    files: [],
    terms: null,
  },
  {
    id: "C-3",
    title: "Audit letter",
    signed: true,
    client: [],
    files: ["letter.pdf"],
    terms: null,
  },
];

export default function NewKinds() {
  return (
    <div style={{ width: "100%" }}>
      <RecordList
        fields={fields}
        titleField="title"
        noun="contract"
        label="Contracts"
        context={{}}
        groups={recordGroups(fields, contracts, "signed")}
        properties={["signed", "client", "files", "terms"]}
      />
    </div>
  );
}
