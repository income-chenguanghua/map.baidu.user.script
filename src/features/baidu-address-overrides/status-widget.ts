import { CLASS_NAMES, STATUS_WIDGET_ID } from "./constants";
import { openConfirmDialog, showToast } from "./feedback";

let statusText = "";

interface StatusWidgetOptions {
  onToggleEditMode: () => void;
  onReset: () => void;
  onHide: () => void;
}

interface StatusWidgetState {
  isEditMode: boolean;
  processedCount: number;
}

export function mountStatusWidget(options: StatusWidgetOptions): void {
  if (document.getElementById(STATUS_WIDGET_ID)) {
    return;
  }

  const widget = document.createElement("div");
  widget.id = STATUS_WIDGET_ID;
  widget.className = CLASS_NAMES.statusWidget;
  widget.innerHTML = `
    <div class="tm-address-override-status__actions">
      <button type="button" class="tm-address-override-status__button tm-address-override-status__button--edit">
        修改
      </button>
      <button type="button" class="tm-address-override-status__button tm-address-override-status__button--reset">
        重置
      </button>
      <button type="button" class="tm-address-override-status__button tm-address-override-status__button--hide">
        隐藏
      </button>
    </div>
    <div class="tm-address-override-status__version">v${__APP_VERSION__}</div>
  `;

  widget
    .querySelector(".tm-address-override-status__button--edit")
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      options.onToggleEditMode();
    });

  widget
    .querySelector(".tm-address-override-status__button--reset")
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openConfirmDialog({
        title: "重置本地修改",
        message: "确认清空已保存的名称和地址修改，并恢复当前列表吗？",
        confirmText: "重置",
        danger: true,
        onConfirm: () => {
          options.onReset();
          showToast("已重置本地修改");
        },
      });
    });

  widget
    .querySelector(".tm-address-override-status__button--hide")
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openConfirmDialog({
        title: "隐藏操作按钮",
        message: "确认隐藏右下角操作按钮吗？隐藏后可以在控制台输入 show() 重新显示。",
        confirmText: "隐藏",
        onConfirm: () => {
          options.onHide();
          hideStatusWidget();
          showToast("操作按钮已隐藏，可输入 show() 恢复");
        },
      });
    });

  widget.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  document.body.appendChild(widget);
  installShowMethod();
  printShowMethodHint();
}

export function updateStatusWidget(state: StatusWidgetState): void {
  const widget = document.getElementById(STATUS_WIDGET_ID);
  if (!widget) {
    return;
  }

  const nextText = state.isEditMode ? "完成" : "修改";
  if (statusText !== nextText) {
    const action = widget.querySelector<HTMLElement>(
      ".tm-address-override-status__button--edit"
    );
    if (action) {
      action.textContent = nextText;
    }
    statusText = nextText;
  }

  widget.title = state.isEditMode
    ? `完成修改，已识别 ${state.processedCount} 条`
    : `进入修改模式，已识别 ${state.processedCount} 条`;
  widget.classList.toggle("is-empty", state.processedCount === 0);
  widget.classList.toggle("is-editing", state.isEditMode);
}

function hideStatusWidget(): void {
  const widget = document.getElementById(STATUS_WIDGET_ID);
  if (widget) {
    widget.hidden = true;
    widget.style.display = "none";
  }
}

function showStatusWidget(): void {
  const widget = document.getElementById(STATUS_WIDGET_ID);
  if (widget) {
    widget.hidden = false;
    widget.style.display = "";
    showToast("操作按钮已显示");
  }
}

function installShowMethod(): void {
  window.show = showStatusWidget;

  const script = document.createElement("script");
  script.textContent = `
    window.show = function () {
      var widget = document.getElementById(${JSON.stringify(STATUS_WIDGET_ID)});
      if (widget) {
        widget.hidden = false;
        widget.style.display = "";
      }
    };
  `;
  document.documentElement.appendChild(script);
  script.remove();
}

function printShowMethodHint(): void {
  console.info(
    "[百度地图地址修改] 右下角操作按钮已加载；如果隐藏了按钮，可在控制台输入 show() 重新显示。"
  );
}
