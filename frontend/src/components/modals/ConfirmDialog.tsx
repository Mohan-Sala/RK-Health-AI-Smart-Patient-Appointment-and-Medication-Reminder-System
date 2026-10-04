import { Modal, ModalFooter } from "./Modal";
import { AlertTriangle } from "lucide-react";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="px-6 py-6 flex items-start gap-4">
        <div className={`h-11 w-11 rounded-2xl grid place-items-center shrink-0 ${tone === "danger" ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"}`}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-[14px] text-foreground/85 leading-relaxed pt-1">{message}</p>
      </div>
      <ModalFooter>
        <button onClick={onClose} className="h-10 px-5 rounded-xl border border-border text-[13.5px] hover:bg-hover transition">
          {cancelLabel}
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={`h-10 px-5 rounded-xl text-[13.5px] font-medium text-white transition ${tone === "danger" ? "bg-danger hover:opacity-90" : "bg-primary hover:opacity-90"}`}
        >
          {confirmLabel}
        </button>
      </ModalFooter>
    </Modal>
  );
}
