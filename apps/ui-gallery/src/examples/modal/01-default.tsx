import {
  Button,
  DialogTrigger,
  Modal,
  ModalClose,
  ModalContent,
  ModalContext,
  ModalHeader,
  ModalTitle,
} from "@forgeron/ui";

// Without `title`, Modal is the root of its own parts; DialogTrigger opens it.
export default function Composed() {
  return (
    <Modal>
      <DialogTrigger render={<Button>Rename view</Button>} />
      <ModalContent size="sm">
        <ModalHeader>
          <ModalContext>OPS</ModalContext>
          <ModalTitle>Rename view</ModalTitle>
          <ModalClose />
        </ModalHeader>
        <p style={{ margin: "12px 0" }}>Shown to everyone in the team.</p>
      </ModalContent>
    </Modal>
  );
}
