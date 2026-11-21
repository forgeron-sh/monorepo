import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@forgeron/ui";

export default function Composed() {
  return (
    <div style={{ width: 360 }}>
      <InputGroup>
        <InputGroupTextarea placeholder="Write a comment…" aria-label="Comment" rows={3} />
        <InputGroupAddon align="block-end">
          <InputGroupText>0 / 280</InputGroupText>
          <InputGroupButton variant="primary" style={{ marginLeft: "auto" }}>
            Send
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
