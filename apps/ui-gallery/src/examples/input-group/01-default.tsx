import { Search01Icon } from "@forgeron/icons";
import {
  Icon,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ display: "grid", gap: 12, width: 360 }}>
      <InputGroup>
        <InputGroupAddon>
          <Icon icon={Search01Icon} size={12} variant="mono" />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search…" aria-label="Search" />
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="example.com" aria-label="Domain" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="secondary">Copy</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
