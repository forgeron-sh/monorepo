import {
  Button,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastTitle,
  Toaster,
  useToast,
} from "@forgeron/ui";

function Actions() {
  const toast = useToast();
  return (
    <Button
      onClick={() =>
        toast.add({
          title: "OPS-40 archived",
          description: "It leaves the board.",
          actionProps: { children: "Undo", onClick: () => toast.add({ title: "OPS-40 restored" }) },
        })
      }
    >
      Archive issue
    </Button>
  );
}

export default function Composed() {
  return (
    <Toaster
      renderToast={(toast) => (
        <Toast toast={toast}>
          <ToastContent>
            <ToastTitle />
            <ToastDescription />
          </ToastContent>
          {toast.actionProps ? <ToastAction /> : null}
          <ToastClose />
        </Toast>
      )}
    >
      <Actions />
    </Toaster>
  );
}
