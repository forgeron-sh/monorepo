import { FILE_KINDS, FileTypeMark, type FileKind } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {(Object.keys(FILE_KINDS) as FileKind[]).map((kind) => (
        <FileTypeMark key={kind} kind={kind} label={FILE_KINDS[kind].label} />
      ))}
    </div>
  );
}
