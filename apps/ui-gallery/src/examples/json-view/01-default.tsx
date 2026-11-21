import { JsonView, JsonViewContent, JsonViewCopy, JsonViewLabel } from "@forgeron/ui";

export default function Composed() {
  return (
    <div style={{ width: 320 }}>
      <JsonView label="Payload" value={{ id: 4182, name: "Transalp", won: true }}>
        <JsonViewLabel />
        <JsonViewContent maxHeight={160}>
          <JsonViewCopy />
        </JsonViewContent>
      </JsonView>
    </div>
  );
}
