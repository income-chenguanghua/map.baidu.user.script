import { CLASS_NAMES, STATUS_WIDGET_ID } from "./constants";

let statusText = "";

interface StatusWidgetOptions {
  onToggleEditMode: () => void;
}

interface StatusWidgetState {
  isEditMode: boolean;
  processedCount: number;
}

export function mountStatusWidget(options: StatusWidgetOptions): void {
  if (document.getElementById(STATUS_WIDGET_ID)) {
    return;
  }

  const button = document.createElement("button");
  button.id = STATUS_WIDGET_ID;
  button.className = CLASS_NAMES.statusWidget;
  button.type = "button";
  button.innerHTML = `
    <span class="tm-address-override-status__action">修改</span>
    <span class="tm-address-override-status__version">v${__APP_VERSION__}</span>
  `;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    options.onToggleEditMode();
  });

  document.body.appendChild(button);
}

export function updateStatusWidget(state: StatusWidgetState): void {
  const button = document.getElementById(STATUS_WIDGET_ID);
  if (!button) {
    return;
  }

  const nextText = state.isEditMode ? "完成" : "修改";
  if (statusText !== nextText) {
    const action = button.querySelector<HTMLElement>(
      ".tm-address-override-status__action"
    );
    if (action) {
      action.textContent = nextText;
    }
    statusText = nextText;
  }

  button.title = state.isEditMode
    ? `完成修改，已识别 ${state.processedCount} 条`
    : `进入修改模式，已识别 ${state.processedCount} 条`;
  button.classList.toggle("is-empty", state.processedCount === 0);
  button.classList.toggle("is-editing", state.isEditMode);
}
