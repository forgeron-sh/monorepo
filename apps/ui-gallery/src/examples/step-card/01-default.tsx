import { Mail01Icon } from "@forgeron/icons";
import {
  StepCard,
  StepCardActions,
  StepCardError,
  StepCardMain,
  StepCardState,
  StepCardSubtitle,
  StepCardText,
  StepCardTitle,
} from "@forgeron/ui";
import { useState } from "react";

// The parts lay the card out; `...rest` goes on the card, so a list can hand it its item props.
export default function Default() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ width: 320, paddingTop: 10 }}>
      <StepCard status="error" selected={open} onSelect={() => setOpen(!open)}>
        <StepCardMain icon={Mail01Icon}>
          <StepCardText>
            <StepCardTitle>Send the invoice</StepCardTitle>
            <StepCardSubtitle>Mail relay · send()</StepCardSubtitle>
          </StepCardText>
        </StepCardMain>
        <StepCardState />
        <StepCardActions>
          <button type="button" className="fg-btn fg-btn-sm">
            Retry
          </button>
        </StepCardActions>
        <StepCardError>Mail relay answered 503</StepCardError>
      </StepCard>
    </div>
  );
}
