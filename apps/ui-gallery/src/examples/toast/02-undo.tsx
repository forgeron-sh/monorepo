import { Button, Toaster, useToast } from "@forgeron/ui";

function Actions() {
  const toast = useToast();
  return (
    <>
      <Button
        onClick={() =>
          toast.add({
            title: "OPS-40 deleted",
            actionProps: {
              children: "Undo",
              onClick: () => toast.add({ title: "OPS-40 restored" }),
            },
          })
        }
      >
        Delete issue
      </Button>
      <Button onClick={() => toast.add({ title: "crm 1.4.0 is live", type: "success" })}>
        Deploy
      </Button>
      <Button
        onClick={() =>
          toast.add({
            title: "The deploy failed",
            description: "Type error in src/actions.ts.",
            type: "danger",
            priority: "high",
          })
        }
      >
        Fail
      </Button>
    </>
  );
}

export default function Undo() {
  return (
    <Toaster>
      <Actions />
    </Toaster>
  );
}
