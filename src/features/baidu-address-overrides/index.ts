import {
  BOOTSTRAP_POLL_INTERVAL_MS,
  BOOTSTRAP_POLL_LIMIT,
} from "./constants";
import {
  appendEditButton,
  getCurrentAddress,
  getCurrentTitle,
  getPoiContext,
  hasEditButton,
  queryPoiItems,
  removeEditButton,
  renderOriginalAddress,
  renderOriginalTitle,
  renderOverriddenAddress,
  renderOverriddenTitle,
  setPoiItemEditMode,
} from "./dom";
import { openAddressEditor } from "./editor-dialog";
import { installAddressOverrideStyles } from "./styles";
import {
  loadOverrideStore,
  removeAddressOverride,
  saveAddressOverride,
} from "./storage";
import {
  mountStatusWidget,
  updateStatusWidget,
} from "./status-widget";
import type { AddressOverrideRecord } from "./types";

let isEditMode = false;

export function startBaiduAddressOverrides(): void {
  if (!document.body) {
    window.addEventListener("DOMContentLoaded", startBaiduAddressOverrides, {
      once: true,
    });
    return;
  }

  installAddressOverrideStyles();
  mountStatusWidget({
    onToggleEditMode: toggleEditMode,
  });
  refreshPoiList();
  observePoiList();
  bootstrapPollPoiList();
}

function refreshPoiList(): void {
  const processedCount = processPoiList();
  updateStatusWidget({
    isEditMode,
    processedCount,
  });
}

function toggleEditMode(): void {
  isEditMode = !isEditMode;
  refreshPoiList();
}

function processPoiList(): number {
  const store = loadOverrideStore();
  let processedCount = 0;

  for (const item of queryPoiItems()) {
    const context = getPoiContext(item);
    if (!context) {
      continue;
    }

    const record = store[context.key];
    const recordTitle = record?.title ?? "";
    if (record?.address && record.address !== context.originalAddress) {
      renderOverriddenAddress(context.addressEl, record.address);
    } else if (context.addressEl.classList.contains("tm-addr-overridden")) {
      renderOriginalAddress(context.addressEl, context.originalAddress);
    }

    if (recordTitle && recordTitle !== context.originalTitle) {
      renderOverriddenTitle(context.titleEl, recordTitle);
    } else if (context.titleEl?.classList.contains("tm-title-overridden")) {
      renderOriginalTitle(context.titleEl, context.originalTitle);
    }

    setPoiItemEditMode(item, isEditMode);
    if (isEditMode) {
      if (!hasEditButton(item)) {
        appendEditButton(context.addressEl, (event) => {
          handleEditButtonClick(event, item);
        });
      }
    } else {
      removeEditButton(item);
    }

    processedCount += 1;
  }

  return processedCount;
}

function handleEditButtonClick(event: MouseEvent, item: HTMLElement): void {
  if (!isEditMode) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if ("stopImmediatePropagation" in event) {
    event.stopImmediatePropagation();
  }

  const context = getPoiContext(item);
  if (!context) {
    return;
  }

  const store = loadOverrideStore();
  const existingRecord = store[context.key];
  const currentTitle =
    existingRecord?.title || getCurrentTitle(context.titleEl) || context.originalTitle;
  const currentAddress = existingRecord?.address || getCurrentAddress(context.addressEl);

  openAddressEditor({
    title: currentTitle || "当前地点",
    currentTitle,
    currentAddress,
    originalTitle: context.originalTitle,
    originalAddress: context.originalAddress,
    onRestore: () => {
      removeAddressOverride(context.key);
      renderOriginalTitle(context.titleEl, context.originalTitle);
      renderOriginalAddress(context.addressEl, context.originalAddress);
    },
    onSave: (values) => {
      const record: AddressOverrideRecord = {
        title: values.title,
        address: values.address,
        originalTitle: context.originalTitle,
        originalAddress: context.originalAddress,
        uid: context.uid,
        updatedAt: Date.now(),
      };

      saveAddressOverride(context.key, record);
      if (values.title !== context.originalTitle) {
        renderOverriddenTitle(context.titleEl, values.title);
      } else {
        renderOriginalTitle(context.titleEl, context.originalTitle);
      }

      if (values.address !== context.originalAddress) {
        renderOverriddenAddress(context.addressEl, values.address);
      } else {
        renderOriginalAddress(context.addressEl, context.originalAddress);
      }
    },
  });
}

function observePoiList(): void {
  let queued = false;

  const scheduleProcess = (): void => {
    if (queued) {
      return;
    }

    queued = true;
    window.requestAnimationFrame(() => {
      queued = false;
      refreshPoiList();
    });
  };

  const observer = new MutationObserver(scheduleProcess);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function bootstrapPollPoiList(): void {
  let count = 0;
  const timer = window.setInterval(() => {
    refreshPoiList();
    count += 1;

    if (count >= BOOTSTRAP_POLL_LIMIT) {
      window.clearInterval(timer);
    }
  }, BOOTSTRAP_POLL_INTERVAL_MS);
}
