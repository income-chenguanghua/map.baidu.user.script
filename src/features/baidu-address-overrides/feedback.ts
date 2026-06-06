interface ConfirmOptions {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
}

const CONFIRM_ID = "tm-address-confirm-dialog";
const TOAST_ROOT_ID = "tm-address-toast-root";

export function openConfirmDialog(options: ConfirmOptions): void {
  closeConfirmDialog();

  const backdrop = document.createElement("div");
  backdrop.id = CONFIRM_ID;
  backdrop.className = "tm-address-confirm-backdrop";

  const dialog = document.createElement("section");
  dialog.className = "tm-address-confirm";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");

  const title = document.createElement("h2");
  title.className = "tm-address-confirm__title";
  title.textContent = options.title;

  const message = document.createElement("p");
  message.className = "tm-address-confirm__message";
  message.textContent = options.message;

  const footer = document.createElement("div");
  footer.className = "tm-address-confirm__footer";

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "tm-address-confirm__button";
  cancelButton.textContent = options.cancelText || "取消";
  cancelButton.addEventListener("click", closeConfirmDialog);

  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className = options.danger
    ? "tm-address-confirm__button tm-address-confirm__button--danger"
    : "tm-address-confirm__button tm-address-confirm__button--primary";
  confirmButton.textContent = options.confirmText;
  confirmButton.addEventListener("click", () => {
    closeConfirmDialog();
    options.onConfirm();
  });

  footer.append(cancelButton, confirmButton);
  dialog.append(title, message, footer);
  backdrop.appendChild(dialog);

  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) {
      closeConfirmDialog();
    }
  });

  document.body.appendChild(backdrop);
  confirmButton.focus();
}

export function showToast(message: string): void {
  const root = ensureToastRoot();
  const toast = document.createElement("div");
  toast.className = "tm-address-toast";
  toast.textContent = message;
  root.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("is-leaving");
    window.setTimeout(() => toast.remove(), 160);
  }, 2000);
}

function closeConfirmDialog(): void {
  document.getElementById(CONFIRM_ID)?.remove();
}

function ensureToastRoot(): HTMLElement {
  const existingRoot = document.getElementById(TOAST_ROOT_ID);
  if (existingRoot) {
    return existingRoot;
  }

  const root = document.createElement("div");
  root.id = TOAST_ROOT_ID;
  root.className = "tm-address-toast-root";
  document.body.appendChild(root);
  return root;
}
