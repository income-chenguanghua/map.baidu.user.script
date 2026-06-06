import {
  ADDRESS_SELECTORS,
  CLASS_NAMES,
  ITEM_SELECTORS,
  LIST_ROOT_SELECTORS,
  ORIGINAL_ADDRESS_DATA_KEY,
  ORIGINAL_TITLE_DATA_KEY,
  TITLE_SELECTORS,
  UID_LINK_SELECTOR,
} from "./constants";
import type { PoiContext } from "./types";

export function queryPoiItems(): HTMLElement[] {
  const items = new Set<HTMLElement>();

  for (const selector of ITEM_SELECTORS) {
    for (const item of document.querySelectorAll<HTMLElement>(selector)) {
      if (looksLikePoiItem(item)) {
        items.add(item);
      }
    }
  }

  for (const selector of LIST_ROOT_SELECTORS) {
    for (const root of document.querySelectorAll<HTMLElement>(selector)) {
      for (const child of Array.from(root.children)) {
        if (child instanceof HTMLElement && looksLikePoiItem(child)) {
          items.add(child);
        }
      }
    }
  }

  for (const link of document.querySelectorAll<HTMLAnchorElement>(
    UID_LINK_SELECTOR
  )) {
    const item = findPoiContainerFromUidLink(link);
    if (item) {
      items.add(item);
    }
  }

  return Array.from(items);
}

export function getUidFromItem(item: Element): string | null {
  const amendLink = item.querySelector<HTMLAnchorElement>(UID_LINK_SELECTOR);
  if (!amendLink?.href) {
    return null;
  }

  try {
    const url = new URL(amendLink.href, window.location.href);
    return url.searchParams.get("uid");
  } catch {
    const match = amendLink.href.match(/[?&]uid=([^&#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
}

function getTitleElement(item: Element): HTMLElement | null {
  return queryFirst<HTMLElement>(item, TITLE_SELECTORS);
}

export function getTitleFromItem(item: Element): string {
  const titleEl = getTitleElement(item);
  if (!titleEl) {
    return "";
  }

  return readTitleText(titleEl);
}

function getAddressElement(item: Element): HTMLElement | null {
  return (
    queryFirst<HTMLElement>(item, ADDRESS_SELECTORS) ||
    findAddressElementByText(item)
  );
}

function readAddressText(addressEl: HTMLElement): string {
  return addressEl.getAttribute("title")?.trim() || addressEl.textContent.trim();
}

function readTitleText(titleEl: HTMLElement): string {
  return titleEl.getAttribute("title")?.trim() || titleEl.textContent.trim();
}

function rememberOriginalAddress(addressEl: HTMLElement): string {
  if (ORIGINAL_ADDRESS_DATA_KEY in addressEl.dataset) {
    return addressEl.dataset[ORIGINAL_ADDRESS_DATA_KEY] ?? "";
  }

  const originalAddress = readAddressText(addressEl);
  addressEl.dataset[ORIGINAL_ADDRESS_DATA_KEY] = originalAddress;
  return originalAddress;
}

function rememberOriginalTitle(titleEl: HTMLElement | null): string {
  if (!titleEl) {
    return "";
  }

  if (ORIGINAL_TITLE_DATA_KEY in titleEl.dataset) {
    return titleEl.dataset[ORIGINAL_TITLE_DATA_KEY] ?? "";
  }

  const originalTitle = readTitleText(titleEl);
  titleEl.dataset[ORIGINAL_TITLE_DATA_KEY] = originalTitle;
  return originalTitle;
}

function buildStableKey(
  item: Element,
  originalTitle: string,
  originalAddress: string
): string | null {
  const uid = getUidFromItem(item);
  if (uid) {
    return `uid:${uid}`;
  }

  if (originalTitle || originalAddress) {
    return `fallback:${originalTitle}|${originalAddress}`;
  }

  return null;
}

export function getPoiContext(item: HTMLElement): PoiContext | null {
  const titleEl = getTitleElement(item);
  const addressEl = getAddressElement(item);
  if (!titleEl && !addressEl) {
    return null;
  }

  const originalTitle = rememberOriginalTitle(titleEl);
  const originalAddress = addressEl ? rememberOriginalAddress(addressEl) : "";
  const key = buildStableKey(item, originalTitle, originalAddress);
  if (!key) {
    return null;
  }

  return {
    item,
    titleEl,
    addressEl,
    key,
    uid: getUidFromItem(item),
    currentTitle: titleEl ? readTitleText(titleEl) : "",
    originalTitle,
    originalAddress,
  };
}

export function getCurrentTitle(titleEl: HTMLElement | null): string {
  return titleEl ? readTitleText(titleEl) : "";
}

export function getCurrentAddress(addressEl: HTMLElement | null): string {
  return addressEl ? readAddressText(addressEl) : "";
}

export function renderOverriddenTitle(
  titleEl: HTMLElement | null,
  title: string
): void {
  if (!titleEl) {
    return;
  }

  titleEl.textContent = title;
  titleEl.setAttribute("title", title);
  titleEl.classList.remove(CLASS_NAMES.overriddenTitle);
}

export function renderOriginalTitle(
  titleEl: HTMLElement | null,
  originalTitle: string
): void {
  if (!titleEl) {
    return;
  }

  titleEl.textContent = originalTitle;
  titleEl.setAttribute("title", originalTitle);
  titleEl.classList.remove(CLASS_NAMES.overriddenTitle);
}

export function renderOverriddenAddress(
  item: HTMLElement,
  addressEl: HTMLElement | null,
  address: string
): void {
  const nextAddressEl = ensureAddressElement(item, addressEl);
  if (!nextAddressEl) {
    return;
  }

  nextAddressEl.textContent = address;
  nextAddressEl.setAttribute("title", address);
  nextAddressEl.classList.remove(CLASS_NAMES.overriddenAddress);
  removeOverrideTag(nextAddressEl);
}

export function renderOriginalAddress(
  addressEl: HTMLElement | null,
  originalAddress: string
): void {
  if (!addressEl) {
    return;
  }

  if (!originalAddress && isScriptCreatedAddressRow(addressEl)) {
    addressEl.closest(".row.addr")?.remove();
    return;
  }

  addressEl.textContent = originalAddress;
  addressEl.setAttribute("title", originalAddress);
  addressEl.classList.remove(CLASS_NAMES.overriddenAddress);
  removeOverrideTag(addressEl);
}

export function hasEditButton(item: Element): boolean {
  return Boolean(item.querySelector(`.${CLASS_NAMES.editButton}`));
}

export function appendEditButton(
  item: HTMLElement,
  addressEl: HTMLElement | null,
  titleEl: HTMLElement | null,
  onClick: (event: MouseEvent) => void
): void {
  const parent = addressEl?.parentElement || titleEl?.parentElement || item;
  if (!parent) {
    return;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = CLASS_NAMES.editButton;
  button.textContent = "修改地址";
  button.addEventListener("pointerdown", stopInteractiveEvent, {
    capture: true,
  });
  button.addEventListener("mousedown", stopInteractiveEvent, { capture: true });
  button.addEventListener(
    "click",
    (event) => {
      stopInteractiveEvent(event);
      onClick(event);
    },
    { capture: true }
  );

  parent.appendChild(button);
}

export function removeEditButton(item: Element): void {
  item.querySelector(`.${CLASS_NAMES.editButton}`)?.remove();
}

function removeOverrideTag(addressEl: HTMLElement): void {
  addressEl.parentElement
    ?.querySelector(`.${CLASS_NAMES.overrideTag}`)
    ?.remove();
}

function ensureAddressElement(
  item: HTMLElement,
  addressEl: HTMLElement | null
): HTMLElement | null {
  if (addressEl) {
    return addressEl;
  }

  const titleEl = getTitleElement(item);
  const titleRow = titleEl?.closest(".row");
  const container =
    titleRow?.parentElement ||
    item.querySelector<HTMLElement>(".ml_30") ||
    item.querySelector<HTMLElement>(".mr_90");

  if (!container) {
    return null;
  }

  const row = document.createElement("div");
  row.className = "row addr";
  row.dataset.tmCreatedAddressRow = "true";

  const span = document.createElement("span");
  span.className = "n-grey";
  span.dataset[ORIGINAL_ADDRESS_DATA_KEY] = "";
  row.appendChild(span);

  if (titleRow?.parentElement === container) {
    titleRow.insertAdjacentElement("afterend", row);
  } else {
    container.appendChild(row);
  }

  return span;
}

function isScriptCreatedAddressRow(addressEl: HTMLElement): boolean {
  return addressEl.closest<HTMLElement>(".row.addr")?.dataset
    .tmCreatedAddressRow === "true";
}

function queryFirst<T extends Element>(
  root: Element,
  selectors: readonly string[]
): T | null {
  for (const selector of selectors) {
    const element = root.querySelector<T>(selector);
    if (element && hasText(element)) {
      return element;
    }
  }

  return null;
}

function looksLikePoiItem(item: HTMLElement): boolean {
  return Boolean(
    getUidFromItem(item) || getTitleElement(item) || getAddressElement(item)
  );
}

function findPoiContainerFromUidLink(link: HTMLElement): HTMLElement | null {
  let current = link.parentElement;

  for (let depth = 0; current && depth < 8; depth += 1) {
    if (matchesAny(current, ITEM_SELECTORS)) {
      return current;
    }

    if (current instanceof HTMLElement && getAddressElement(current)) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function matchesAny(element: Element, selectors: readonly string[]): boolean {
  return selectors.some((selector) => element.matches(selector));
}

function findAddressElementByText(item: Element): HTMLElement | null {
  const candidates = item.querySelectorAll<HTMLElement>("span, div, p");

  for (const candidate of candidates) {
    const text = candidate.textContent.trim();
    if (!text || text.length > 140) {
      continue;
    }

    const className =
      typeof candidate.className === "string"
        ? candidate.className.toLowerCase()
        : "";

    if (className.includes("addr") || className.includes("address")) {
      return candidate;
    }

    if (/^地址[:：]/.test(text)) {
      return candidate;
    }
  }

  return null;
}

function hasText(element: Element): boolean {
  return Boolean(element.textContent?.trim());
}

function stopInteractiveEvent(event: Event): void {
  event.preventDefault();
  event.stopPropagation();

  if ("stopImmediatePropagation" in event) {
    event.stopImmediatePropagation();
  }
}
