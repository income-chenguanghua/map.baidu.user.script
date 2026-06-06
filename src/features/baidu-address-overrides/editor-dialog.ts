import { CLASS_NAMES } from "./constants";

interface AddressEditorOptions {
  title: string;
  currentTitle: string;
  currentAddress: string;
  originalTitle: string;
  originalAddress: string;
  onSave: (values: { title: string; address: string }) => void;
  onRestore: () => void;
}

const DIALOG_ID = "tm-address-override-dialog";
let removeKeydownListener: (() => void) | null = null;

export function openAddressEditor(options: AddressEditorOptions): void {
  closeAddressEditor();

  const backdrop = document.createElement("div");
  backdrop.id = DIALOG_ID;
  backdrop.className = "tm-address-dialog-backdrop";

  const dialog = document.createElement("section");
  dialog.className = "tm-address-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");

  const header = document.createElement("header");
  header.className = "tm-address-dialog__header";

  const title = document.createElement("h2");
  title.className = "tm-address-dialog__title";
  title.textContent = "修改名称和地址";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "tm-address-dialog__icon-button";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", "关闭");
  closeButton.addEventListener("click", closeAddressEditor);

  header.append(title, closeButton);

  const body = document.createElement("div");
  body.className = "tm-address-dialog__body";

  const poiName = document.createElement("div");
  poiName.className = "tm-address-dialog__poi";
  poiName.textContent = options.title;

  const titleField = document.createElement("label");
  titleField.className = "tm-address-dialog__field";

  const titleFieldLabel = document.createElement("span");
  titleFieldLabel.className = "tm-address-dialog__label";
  titleFieldLabel.textContent = "名称";

  const titleInput = document.createElement("input");
  titleInput.className = "tm-address-dialog__input";
  titleInput.type = "text";
  titleInput.value = options.currentTitle || options.originalTitle || options.title;

  titleField.append(titleFieldLabel, titleInput);

  const addressField = document.createElement("label");
  addressField.className = "tm-address-dialog__field";

  const fieldLabel = document.createElement("span");
  fieldLabel.className = "tm-address-dialog__label";
  fieldLabel.textContent = "地址";

  const textarea = document.createElement("textarea");
  textarea.className = "tm-address-dialog__textarea";
  textarea.rows = 4;
  textarea.value = options.currentAddress;

  addressField.append(fieldLabel, textarea);

  const original = document.createElement("p");
  original.className = "tm-address-dialog__original";
  original.textContent = `原始名称：${options.originalTitle || "无"} / 原始地址：${
    options.originalAddress || "无"
  }`;

  body.append(poiName, titleField, addressField, original);

  const footer = document.createElement("footer");
  footer.className = "tm-address-dialog__footer";

  const restoreButton = document.createElement("button");
  restoreButton.type = "button";
  restoreButton.className = `${CLASS_NAMES.dialogButton} ${CLASS_NAMES.dialogButtonDanger}`;
  restoreButton.textContent = "恢复原始地址";
  restoreButton.addEventListener("click", () => {
    options.onRestore();
    closeAddressEditor();
  });

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = CLASS_NAMES.dialogButton;
  cancelButton.textContent = "取消";
  cancelButton.addEventListener("click", closeAddressEditor);

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = `${CLASS_NAMES.dialogButton} ${CLASS_NAMES.dialogButtonPrimary}`;
  saveButton.textContent = "保存";
  saveButton.addEventListener("click", () => {
    const nextTitle = titleInput.value.trim();
    const nextAddress = textarea.value.trim();
    if (!nextTitle && !nextAddress) {
      options.onRestore();
    } else {
      options.onSave({
        title: nextTitle || options.originalTitle || options.title,
        address: nextAddress || options.originalAddress,
      });
    }

    closeAddressEditor();
  });

  footer.append(restoreButton, cancelButton, saveButton);
  dialog.append(header, body, footer);
  backdrop.appendChild(dialog);

  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) {
      closeAddressEditor();
    }
  });

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      closeAddressEditor();
    }
  };
  document.addEventListener("keydown", handleKeydown);
  removeKeydownListener = () => {
    document.removeEventListener("keydown", handleKeydown);
  };

  document.body.appendChild(backdrop);
  window.setTimeout(() => titleInput.focus(), 0);
}

function closeAddressEditor(): void {
  removeKeydownListener?.();
  removeKeydownListener = null;
  document.getElementById(DIALOG_ID)?.remove();
}
