import {
  ApprovalChain,
  ApprovalChainAdd,
  ApprovalChainAudit,
  ApprovalChainBody,
  ApprovalChainComments,
  ApprovalChainFoot,
  ApprovalChainHeader,
  ApprovalChainLive,
  ApprovalChainModes,
  ApprovalChainPeople,
  ApprovalChainRail,
  ApprovalChainStep,
  ApprovalChainStepHead,
  ApprovalChainSteps,
  type ApprovalStep,
} from "@forgeron/ui";

const steps: ApprovalStep[] = [
  {
    id: "manager",
    label: "Manager",
    due: "2026-11-14",
    participants: [
      {
        id: "lea",
        name: "Léa Martin",
        role: "Team lead",
        status: "approved",
        at: "2026-11-13T09:12:00Z",
      },
    ],
    comments: [
      {
        id: "c1",
        author: "Léa Martin",
        at: "2026-11-13T09:12:00Z",
        text: "Fine for me, receipts attached.",
      },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    mode: "parallel",
    due: "2026-11-18",
    participants: [
      { id: "karim", name: "Karim Aziz", role: "Controller", reminded: "2026-11-17" },
      { id: "jo", name: "Jo Bernard", role: "Accounting" },
    ],
  },
  {
    id: "director",
    label: "Director",
    participants: [{ id: "sam", name: "Sam Roche", role: "Director" }],
  },
];

export default function Composed() {
  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <ApprovalChain
        label="Expense 214"
        value={steps}
        today="2026-11-19"
        onRemind={() => {}}
        events={[
          {
            id: "e1",
            at: "2026-11-12T16:40:00Z",
            actor: "Sam",
            action: "submitted the expense",
            tone: "neutral",
          },
          {
            id: "e2",
            at: "2026-11-13T09:12:00Z",
            actor: "Léa Martin",
            action: "approved",
            tone: "success",
          },
        ]}
      >
        <ApprovalChainHeader />
        <ApprovalChainSteps
          renderStep={(step, index) => (
            <ApprovalChainStep step={step} index={index}>
              <ApprovalChainRail />
              <ApprovalChainBody>
                <ApprovalChainStepHead />
                <ApprovalChainModes />
                <ApprovalChainPeople />
                <ApprovalChainAdd />
                <ApprovalChainComments />
              </ApprovalChainBody>
            </ApprovalChainStep>
          )}
        />
        <ApprovalChainFoot />
        <ApprovalChainAudit />
        <ApprovalChainLive />
      </ApprovalChain>
    </div>
  );
}
