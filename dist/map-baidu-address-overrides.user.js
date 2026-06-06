// ==UserScript==
// @name         百度地图左侧地址本地修改
// @namespace    local.bdmap.address.override
// @version      26.66.2210
// @author       chengguanghua
// @description  本地覆盖百度地图搜索结果左侧地址，刷新后继续按 POI uid 生效。
// @downloadURL  https://github.com/income-chenguanghua/map.baidu.user.script/raw/refs/heads/main/dist/map-baidu-address-overrides.user.js
// @updateURL    https://github.com/income-chenguanghua/map.baidu.user.script/raw/refs/heads/main/dist/map-baidu-address-overrides.user.js
// @match        https://map.baidu.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(function() {
	"use strict";
	var STORE_KEY = "bdmap_poi_address_overrides_v1";
	var ITEM_SELECTORS = [
		".poilist .search-item",
		".poilist [data-index]",
		".search-item",
		".result-item",
		".poi-item",
		"[class*='search-item']",
		"[class*='result-item']"
	];
	var LIST_ROOT_SELECTORS = [
		".poilist",
		".search-list",
		".result-list",
		"[class*='poi-list']",
		"[class*='search-list']"
	];
	var UID_LINK_SELECTOR = "a[href*=\"uid=\"]";
	var TITLE_SELECTORS = [
		".n-blue",
		".name",
		".title",
		"[class*='title']",
		"[class*='name']",
		"h3",
		"h4",
		"a[title]"
	];
	var ADDRESS_SELECTORS = [
		".row.addr .n-grey",
		".row.address .n-grey",
		".addr .n-grey",
		".address .n-grey",
		".addr",
		".address",
		"[class*='addr'] [class*='grey']",
		"[class*='address'] [class*='grey']",
		"[class*='addr']",
		"[class*='address']"
	];
	var CLASS_NAMES = {
		editButton: "tm-edit-addr-btn",
		overriddenAddress: "tm-addr-overridden",
		overriddenTitle: "tm-title-overridden",
		overrideTag: "tm-addr-tag",
		statusWidget: "tm-address-override-status",
		dialogButton: "tm-address-dialog__button",
		dialogButtonPrimary: "tm-address-dialog__button--primary",
		dialogButtonDanger: "tm-address-dialog__button--danger"
	};
	var STATUS_WIDGET_ID = "tm-address-override-status";
	var ORIGINAL_ADDRESS_DATA_KEY = "tmOriginalAddress";
	var ORIGINAL_TITLE_DATA_KEY = "tmOriginalTitle";
	function queryPoiItems() {
		const items = new Set();
		for (const selector of ITEM_SELECTORS) for (const item of document.querySelectorAll(selector)) if (looksLikePoiItem(item)) items.add(item);
		for (const selector of LIST_ROOT_SELECTORS) for (const root of document.querySelectorAll(selector)) for (const child of Array.from(root.children)) if (child instanceof HTMLElement && looksLikePoiItem(child)) items.add(child);
		for (const link of document.querySelectorAll(UID_LINK_SELECTOR)) {
			const item = findPoiContainerFromUidLink(link);
			if (item) items.add(item);
		}
		return Array.from(items);
	}
	function getUidFromItem(item) {
		const amendLink = item.querySelector(UID_LINK_SELECTOR);
		if (!amendLink?.href) return null;
		try {
			return new URL(amendLink.href, window.location.href).searchParams.get("uid");
		} catch {
			const match = amendLink.href.match(/[?&]uid=([^&#]+)/);
			return match ? decodeURIComponent(match[1]) : null;
		}
	}
	function getTitleElement(item) {
		return queryFirst(item, TITLE_SELECTORS);
	}
	function getAddressElement(item) {
		return queryFirst(item, ADDRESS_SELECTORS) || findAddressElementByText(item);
	}
	function readAddressText(addressEl) {
		return addressEl.getAttribute("title")?.trim() || addressEl.textContent.trim();
	}
	function readTitleText(titleEl) {
		return titleEl.getAttribute("title")?.trim() || titleEl.textContent.trim();
	}
	function rememberOriginalAddress(addressEl) {
		if ("tmOriginalAddress" in addressEl.dataset) return addressEl.dataset["tmOriginalAddress"] ?? "";
		const originalAddress = readAddressText(addressEl);
		addressEl.dataset[ORIGINAL_ADDRESS_DATA_KEY] = originalAddress;
		return originalAddress;
	}
	function rememberOriginalTitle(titleEl) {
		if (!titleEl) return "";
		if ("tmOriginalTitle" in titleEl.dataset) return titleEl.dataset["tmOriginalTitle"] ?? "";
		const originalTitle = readTitleText(titleEl);
		titleEl.dataset[ORIGINAL_TITLE_DATA_KEY] = originalTitle;
		return originalTitle;
	}
	function buildStableKey(item, originalTitle, originalAddress) {
		const uid = getUidFromItem(item);
		if (uid) return `uid:${uid}`;
		if (originalTitle || originalAddress) return `fallback:${originalTitle}|${originalAddress}`;
		return null;
	}
	function getPoiContext(item) {
		const titleEl = getTitleElement(item);
		const addressEl = getAddressElement(item);
		if (!titleEl && !addressEl) return null;
		const originalTitle = rememberOriginalTitle(titleEl);
		const originalAddress = addressEl ? rememberOriginalAddress(addressEl) : "";
		const key = buildStableKey(item, originalTitle, originalAddress);
		if (!key) return null;
		return {
			item,
			titleEl,
			addressEl,
			key,
			uid: getUidFromItem(item),
			currentTitle: titleEl ? readTitleText(titleEl) : "",
			originalTitle,
			originalAddress
		};
	}
	function getCurrentTitle(titleEl) {
		return titleEl ? readTitleText(titleEl) : "";
	}
	function getCurrentAddress(addressEl) {
		return addressEl ? readAddressText(addressEl) : "";
	}
	function renderOverriddenTitle(titleEl, title) {
		if (!titleEl) return;
		titleEl.textContent = title;
		titleEl.setAttribute("title", title);
		titleEl.classList.remove(CLASS_NAMES.overriddenTitle);
	}
	function renderOriginalTitle(titleEl, originalTitle) {
		if (!titleEl) return;
		titleEl.textContent = originalTitle;
		titleEl.setAttribute("title", originalTitle);
		titleEl.classList.remove(CLASS_NAMES.overriddenTitle);
	}
	function renderOverriddenAddress(item, addressEl, address) {
		const nextAddressEl = ensureAddressElement(item, addressEl);
		if (!nextAddressEl) return;
		nextAddressEl.textContent = address;
		nextAddressEl.setAttribute("title", address);
		nextAddressEl.classList.remove(CLASS_NAMES.overriddenAddress);
		removeOverrideTag(nextAddressEl);
	}
	function renderOriginalAddress(addressEl, originalAddress) {
		if (!addressEl) return;
		if (!originalAddress && isScriptCreatedAddressRow(addressEl)) {
			addressEl.closest(".row.addr")?.remove();
			return;
		}
		addressEl.textContent = originalAddress;
		addressEl.setAttribute("title", originalAddress);
		addressEl.classList.remove(CLASS_NAMES.overriddenAddress);
		removeOverrideTag(addressEl);
	}
	function hasEditButton(item) {
		return Boolean(item.querySelector(`.${CLASS_NAMES.editButton}`));
	}
	function appendEditButton(item, addressEl, titleEl, onClick) {
		const parent = addressEl?.parentElement || titleEl?.parentElement || item;
		if (!parent) return;
		const button = document.createElement("button");
		button.type = "button";
		button.className = CLASS_NAMES.editButton;
		button.textContent = "修改地址";
		button.addEventListener("pointerdown", stopInteractiveEvent, { capture: true });
		button.addEventListener("mousedown", stopInteractiveEvent, { capture: true });
		button.addEventListener("click", (event) => {
			stopInteractiveEvent(event);
			onClick(event);
		}, { capture: true });
		parent.appendChild(button);
	}
	function removeEditButton(item) {
		item.querySelector(`.${CLASS_NAMES.editButton}`)?.remove();
	}
	function removeOverrideTag(addressEl) {
		addressEl.parentElement?.querySelector(`.${CLASS_NAMES.overrideTag}`)?.remove();
	}
	function ensureAddressElement(item, addressEl) {
		if (addressEl) return addressEl;
		const titleRow = getTitleElement(item)?.closest(".row");
		const container = titleRow?.parentElement || item.querySelector(".ml_30") || item.querySelector(".mr_90");
		if (!container) return null;
		const row = document.createElement("div");
		row.className = "row addr";
		row.dataset.tmCreatedAddressRow = "true";
		const span = document.createElement("span");
		span.className = "n-grey";
		span.dataset[ORIGINAL_ADDRESS_DATA_KEY] = "";
		row.appendChild(span);
		if (titleRow?.parentElement === container) titleRow.insertAdjacentElement("afterend", row);
		else container.appendChild(row);
		return span;
	}
	function isScriptCreatedAddressRow(addressEl) {
		return addressEl.closest(".row.addr")?.dataset.tmCreatedAddressRow === "true";
	}
	function queryFirst(root, selectors) {
		for (const selector of selectors) {
			const element = root.querySelector(selector);
			if (element && hasText(element)) return element;
		}
		return null;
	}
	function looksLikePoiItem(item) {
		return Boolean(getUidFromItem(item) || getTitleElement(item) || getAddressElement(item));
	}
	function findPoiContainerFromUidLink(link) {
		let current = link.parentElement;
		for (let depth = 0; current && depth < 8; depth += 1) {
			if (matchesAny(current, ITEM_SELECTORS)) return current;
			if (current instanceof HTMLElement && getAddressElement(current)) return current;
			current = current.parentElement;
		}
		return null;
	}
	function matchesAny(element, selectors) {
		return selectors.some((selector) => element.matches(selector));
	}
	function findAddressElementByText(item) {
		const candidates = item.querySelectorAll("span, div, p");
		for (const candidate of candidates) {
			const text = candidate.textContent.trim();
			if (!text || text.length > 140) continue;
			const className = typeof candidate.className === "string" ? candidate.className.toLowerCase() : "";
			if (className.includes("addr") || className.includes("address")) return candidate;
			if (/^地址[:：]/.test(text)) return candidate;
		}
		return null;
	}
	function hasText(element) {
		return Boolean(element.textContent?.trim());
	}
	function stopInteractiveEvent(event) {
		event.preventDefault();
		event.stopPropagation();
		if ("stopImmediatePropagation" in event) event.stopImmediatePropagation();
	}
	var DIALOG_ID = "tm-address-override-dialog";
	var removeKeydownListener = null;
	function openAddressEditor(options) {
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
		original.textContent = `原始名称：${options.originalTitle || "无"} / 原始地址：${options.originalAddress || "无"}`;
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
			if (!nextTitle && !nextAddress) options.onRestore();
			else options.onSave({
				title: nextTitle || options.originalTitle || options.title,
				address: nextAddress || options.originalAddress
			});
			closeAddressEditor();
		});
		footer.append(restoreButton, cancelButton, saveButton);
		dialog.append(header, body, footer);
		backdrop.appendChild(dialog);
		backdrop.addEventListener("click", (event) => {
			if (event.target === backdrop) closeAddressEditor();
		});
		const handleKeydown = (event) => {
			if (event.key === "Escape") closeAddressEditor();
		};
		document.addEventListener("keydown", handleKeydown);
		removeKeydownListener = () => {
			document.removeEventListener("keydown", handleKeydown);
		};
		document.body.appendChild(backdrop);
		window.setTimeout(() => titleInput.focus(), 0);
	}
	function closeAddressEditor() {
		removeKeydownListener?.();
		removeKeydownListener = null;
		document.getElementById(DIALOG_ID)?.remove();
	}
	var _GM_addStyle = (() => typeof GM_addStyle != "undefined" ? GM_addStyle : void 0)();
	var _GM_getValue = (() => typeof GM_getValue != "undefined" ? GM_getValue : void 0)();
	var _GM_setValue = (() => typeof GM_setValue != "undefined" ? GM_setValue : void 0)();
	var installed = false;
	function installAddressOverrideStyles() {
		if (installed) return;
		injectStyle(`
    .tm-edit-addr-btn {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      height: 24px;
      margin-left: 8px;
      padding: 0 8px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      background: #f6f8fa;
      color: #0969da;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12px;
      font-weight: 500;
      line-height: 20px;
      cursor: pointer;
      user-select: none;
      vertical-align: middle;
    }

    .tm-edit-addr-btn:hover {
      background: #f3f4f6;
      border-color: #afb8c1;
      text-decoration: none;
    }

    .tm-edit-addr-btn:active {
      background: #ebecf0;
    }

    .tm-edit-addr-btn:focus-visible {
      outline: 2px solid #0969da;
      outline-offset: 2px;
    }

    .tm-address-override-status {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 2147483646;
      display: inline-flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 3px;
      min-width: 64px;
      padding: 7px 10px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      background: #f6f8fa;
      box-shadow: 0 8px 24px rgba(140, 149, 159, 0.2);
      color: #24292f;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12px;
      font-weight: 500;
      line-height: 1.1;
      text-align: right;
    }

    .tm-address-override-status__actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }

    .tm-address-override-status__button {
      height: 28px;
      padding: 0 10px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      background: #f6f8fa;
      color: #24292f;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12px;
      font-weight: 600;
      line-height: 20px;
    }

    .tm-address-override-status__button:hover {
      background: #f3f4f6;
      border-color: #afb8c1;
    }

    .tm-address-override-status__button--reset {
      color: #cf222e;
    }

    .tm-address-override-status__version {
      display: block;
      width: 100%;
      color: #57606a;
      opacity: 0.66;
      font-size: 10px;
      font-weight: 500;
      line-height: 12px;
      text-align: right;
    }

    .tm-address-override-status:hover {
      background: #f3f4f6;
      border-color: #afb8c1;
    }

    .tm-address-override-status.is-empty {
      color: #57606a;
    }

    .tm-address-override-status.is-editing {
      border-color: #d0d7de;
      background: #f6f8fa;
      color: #24292f;
    }

    .tm-address-override-status.is-editing .tm-address-override-status__button--edit {
      border-color: rgba(27, 31, 36, 0.15);
      background: #2da44e;
      color: #ffffff;
    }

    .tm-address-override-status.is-editing .tm-address-override-status__version {
      color: #57606a;
      opacity: 0.66;
    }

    .tm-address-override-status.is-editing .tm-address-override-status__button--edit:hover {
      background: #2c974b;
      border-color: rgba(27, 31, 36, 0.15);
    }

    .tm-address-dialog-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(31, 35, 40, 0.45);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .tm-address-dialog {
      width: min(440px, 100%);
      overflow: hidden;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      background: #ffffff;
      box-shadow: 0 16px 32px rgba(31, 35, 40, 0.16);
      color: #24292f;
    }

    .tm-address-dialog__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #d0d7de;
      background: #f6f8fa;
    }

    .tm-address-dialog__title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      line-height: 20px;
    }

    .tm-address-dialog__icon-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: #57606a;
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
    }

    .tm-address-dialog__icon-button:hover {
      background: #eaedf0;
      color: #24292f;
    }

    .tm-address-dialog__body {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
    }

    .tm-address-dialog__poi {
      color: #24292f;
      font-size: 14px;
      font-weight: 600;
      line-height: 20px;
      overflow-wrap: anywhere;
    }

    .tm-address-dialog__field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .tm-address-dialog__label {
      color: #24292f;
      font-size: 13px;
      font-weight: 600;
      line-height: 18px;
    }

    .tm-address-dialog__input,
    .tm-address-dialog__textarea {
      min-height: 92px;
      padding: 8px 12px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      background: #ffffff;
      color: #24292f;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      line-height: 20px;
      outline: none;
      box-shadow: inset 0 1px 0 rgba(208, 215, 222, 0.2);
    }

    .tm-address-dialog__input {
      min-height: 0;
      height: 34px;
    }

    .tm-address-dialog__textarea {
      resize: vertical;
    }

    .tm-address-dialog__input:focus,
    .tm-address-dialog__textarea:focus {
      border-color: #0969da;
      box-shadow: inset 0 0 0 1px #0969da;
    }

    .tm-address-dialog__original {
      margin: 0;
      color: #57606a;
      font-size: 12px;
      line-height: 18px;
      overflow-wrap: anywhere;
    }

    .tm-address-dialog__footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid #d0d7de;
      background: #f6f8fa;
    }

    .tm-address-dialog__button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 64px;
      height: 32px;
      padding: 0 12px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      background: #f6f8fa;
      color: #24292f;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12px;
      font-weight: 500;
      line-height: 20px;
    }

    .tm-address-dialog__button:hover {
      background: #f3f4f6;
      border-color: #afb8c1;
    }

    .tm-address-dialog__button--primary {
      border-color: rgba(27, 31, 36, 0.15);
      background: #2da44e;
      color: #ffffff;
    }

    .tm-address-dialog__button--primary:hover {
      background: #2c974b;
      border-color: rgba(27, 31, 36, 0.15);
    }

    .tm-address-dialog__button--danger {
      margin-right: auto;
      color: #cf222e;
    }

    .tm-address-dialog__button--danger:hover {
      border-color: rgba(207, 34, 46, 0.4);
      background: #ffebe9;
    }

    .tm-address-confirm-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(31, 35, 40, 0.35);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .tm-address-confirm {
      width: min(360px, 100%);
      padding: 16px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      background: #ffffff;
      box-shadow: 0 16px 32px rgba(31, 35, 40, 0.16);
      color: #24292f;
    }

    .tm-address-confirm__title {
      margin: 0 0 8px;
      font-size: 14px;
      font-weight: 600;
      line-height: 20px;
    }

    .tm-address-confirm__message {
      margin: 0;
      color: #57606a;
      font-size: 13px;
      line-height: 20px;
    }

    .tm-address-confirm__footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }

    .tm-address-confirm__button {
      height: 32px;
      padding: 0 12px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      background: #f6f8fa;
      color: #24292f;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12px;
      font-weight: 500;
      line-height: 20px;
    }

    .tm-address-confirm__button:hover {
      background: #f3f4f6;
      border-color: #afb8c1;
    }

    .tm-address-confirm__button--primary {
      border-color: rgba(27, 31, 36, 0.15);
      background: #2da44e;
      color: #ffffff;
    }

    .tm-address-confirm__button--primary:hover {
      background: #2c974b;
      border-color: rgba(27, 31, 36, 0.15);
    }

    .tm-address-confirm__button--danger {
      border-color: rgba(27, 31, 36, 0.15);
      background: #cf222e;
      color: #ffffff;
    }

    .tm-address-confirm__button--danger:hover {
      background: #a40e26;
      border-color: rgba(27, 31, 36, 0.15);
    }

    .tm-address-toast-root {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .tm-address-toast {
      max-width: 320px;
      padding: 10px 12px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      background: #24292f;
      box-shadow: 0 8px 24px rgba(140, 149, 159, 0.24);
      color: #ffffff;
      font-size: 13px;
      line-height: 18px;
      opacity: 1;
      transition:
        opacity 160ms ease,
        transform 160ms ease;
    }

    .tm-address-toast.is-leaving {
      opacity: 0;
      transform: translateY(-4px);
    }
  `);
		installed = true;
	}
	function injectStyle(css) {
		if (typeof _GM_addStyle === "function") {
			_GM_addStyle(css);
			return;
		}
		const style = document.createElement("style");
		style.textContent = css;
		document.head.appendChild(style);
	}
	function loadOverrideStore() {
		try {
			const value = getStorageValue();
			if (!value || typeof value !== "object" || Array.isArray(value)) return {};
			return value;
		} catch (error) {
			console.warn("[BDMap Address Override] load error:", error);
			return {};
		}
	}
	function saveOverrideStore(store) {
		try {
			setStorageValue(store);
		} catch (error) {
			console.warn("[BDMap Address Override] save error:", error);
		}
	}
	function saveAddressOverride(key, record) {
		const store = loadOverrideStore();
		store[key] = record;
		saveOverrideStore(store);
	}
	function removeAddressOverride(key) {
		const store = loadOverrideStore();
		delete store[key];
		saveOverrideStore(store);
	}
	function clearAddressOverrides() {
		saveOverrideStore({});
	}
	function getStorageValue() {
		if (typeof _GM_getValue === "function") return _GM_getValue(STORE_KEY, {});
		const rawValue = window.localStorage.getItem(STORE_KEY);
		if (!rawValue) return {};
		return JSON.parse(rawValue);
	}
	function setStorageValue(store) {
		if (typeof _GM_setValue === "function") {
			_GM_setValue(STORE_KEY, store);
			return;
		}
		window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
	}
	var CONFIRM_ID = "tm-address-confirm-dialog";
	var TOAST_ROOT_ID = "tm-address-toast-root";
	function openConfirmDialog(options) {
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
		confirmButton.className = options.danger ? "tm-address-confirm__button tm-address-confirm__button--danger" : "tm-address-confirm__button tm-address-confirm__button--primary";
		confirmButton.textContent = options.confirmText;
		confirmButton.addEventListener("click", () => {
			closeConfirmDialog();
			options.onConfirm();
		});
		footer.append(cancelButton, confirmButton);
		dialog.append(title, message, footer);
		backdrop.appendChild(dialog);
		backdrop.addEventListener("click", (event) => {
			if (event.target === backdrop) closeConfirmDialog();
		});
		document.body.appendChild(backdrop);
		confirmButton.focus();
	}
	function showToast(message) {
		const root = ensureToastRoot();
		const toast = document.createElement("div");
		toast.className = "tm-address-toast";
		toast.textContent = message;
		root.appendChild(toast);
		window.setTimeout(() => {
			toast.classList.add("is-leaving");
			window.setTimeout(() => toast.remove(), 160);
		}, 2e3);
	}
	function closeConfirmDialog() {
		document.getElementById(CONFIRM_ID)?.remove();
	}
	function ensureToastRoot() {
		const existingRoot = document.getElementById(TOAST_ROOT_ID);
		if (existingRoot) return existingRoot;
		const root = document.createElement("div");
		root.id = TOAST_ROOT_ID;
		root.className = "tm-address-toast-root";
		document.body.appendChild(root);
		return root;
	}
	var statusText = "";
	function mountStatusWidget(options) {
		if (document.getElementById("tm-address-override-status")) return;
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
    <div class="tm-address-override-status__version">v26.66.2210</div>
  `;
		widget.querySelector(".tm-address-override-status__button--edit")?.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			options.onToggleEditMode();
		});
		widget.querySelector(".tm-address-override-status__button--reset")?.addEventListener("click", (event) => {
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
				}
			});
		});
		widget.querySelector(".tm-address-override-status__button--hide")?.addEventListener("click", (event) => {
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
				}
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
	function updateStatusWidget(state) {
		const widget = document.getElementById(STATUS_WIDGET_ID);
		if (!widget) return;
		const nextText = state.isEditMode ? "完成" : "修改";
		if (statusText !== nextText) {
			const action = widget.querySelector(".tm-address-override-status__button--edit");
			if (action) action.textContent = nextText;
			statusText = nextText;
		}
		widget.title = state.isEditMode ? `完成修改，已识别 ${state.processedCount} 条` : `进入修改模式，已识别 ${state.processedCount} 条`;
		widget.classList.toggle("is-empty", state.processedCount === 0);
		widget.classList.toggle("is-editing", state.isEditMode);
	}
	function hideStatusWidget() {
		const widget = document.getElementById(STATUS_WIDGET_ID);
		if (widget) {
			widget.hidden = true;
			widget.style.display = "none";
		}
	}
	function showStatusWidget() {
		const widget = document.getElementById(STATUS_WIDGET_ID);
		if (widget) {
			widget.hidden = false;
			widget.style.display = "";
			showToast("操作按钮已显示");
		}
	}
	function installShowMethod() {
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
	function printShowMethodHint() {
		console.info("[百度地图地址修改] 右下角操作按钮已加载；如果隐藏了按钮，可在控制台输入 show() 重新显示。");
	}
	var isEditMode = false;
	function startBaiduAddressOverrides() {
		if (!document.body) {
			window.addEventListener("DOMContentLoaded", startBaiduAddressOverrides, { once: true });
			return;
		}
		installAddressOverrideStyles();
		mountStatusWidget({
			onToggleEditMode: toggleEditMode,
			onReset: resetOverrides,
			onHide: exitEditMode
		});
		refreshPoiList();
		observePoiList();
		bootstrapPollPoiList();
	}
	function refreshPoiList() {
		const processedCount = processPoiList();
		updateStatusWidget({
			isEditMode,
			processedCount
		});
	}
	function toggleEditMode() {
		isEditMode = !isEditMode;
		refreshPoiList();
	}
	function exitEditMode() {
		isEditMode = false;
		refreshPoiList();
	}
	function resetOverrides() {
		clearAddressOverrides();
		isEditMode = false;
		for (const item of queryPoiItems()) {
			const context = getPoiContext(item);
			if (!context) continue;
			renderOriginalTitle(context.titleEl, context.originalTitle);
			renderOriginalAddress(context.addressEl, context.originalAddress);
			removeEditButton(item);
		}
		refreshPoiList();
	}
	function processPoiList() {
		const store = loadOverrideStore();
		let processedCount = 0;
		for (const item of queryPoiItems()) {
			const context = getPoiContext(item);
			if (!context) continue;
			const record = store[context.key];
			const recordTitle = record?.title ?? "";
			if (record?.address && record.address !== context.originalAddress) renderOverriddenAddress(context.item, context.addressEl, record.address);
			else if (context.addressEl?.classList.contains("tm-addr-overridden")) renderOriginalAddress(context.addressEl, context.originalAddress);
			if (recordTitle && recordTitle !== context.originalTitle) renderOverriddenTitle(context.titleEl, recordTitle);
			else if (context.titleEl?.classList.contains("tm-title-overridden")) renderOriginalTitle(context.titleEl, context.originalTitle);
			if (isEditMode) {
				if (!hasEditButton(item)) appendEditButton(item, context.addressEl, context.titleEl, (event) => {
					handleEditButtonClick(event, item);
				});
			} else removeEditButton(item);
			processedCount += 1;
		}
		return processedCount;
	}
	function handleEditButtonClick(event, item) {
		if (!isEditMode) return;
		event.preventDefault();
		event.stopPropagation();
		if ("stopImmediatePropagation" in event) event.stopImmediatePropagation();
		const context = getPoiContext(item);
		if (!context) return;
		const existingRecord = loadOverrideStore()[context.key];
		const currentTitle = existingRecord?.title || getCurrentTitle(context.titleEl) || context.originalTitle;
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
				const record = {
					title: values.title,
					address: values.address,
					originalTitle: context.originalTitle,
					originalAddress: context.originalAddress,
					uid: context.uid,
					updatedAt: Date.now()
				};
				saveAddressOverride(context.key, record);
				if (values.title !== context.originalTitle) renderOverriddenTitle(context.titleEl, values.title);
				else renderOriginalTitle(context.titleEl, context.originalTitle);
				if (values.address !== context.originalAddress) renderOverriddenAddress(context.item, context.addressEl, values.address);
				else renderOriginalAddress(context.addressEl, context.originalAddress);
			}
		});
	}
	function observePoiList() {
		let queued = false;
		const scheduleProcess = () => {
			if (queued) return;
			queued = true;
			window.requestAnimationFrame(() => {
				queued = false;
				refreshPoiList();
			});
		};
		new MutationObserver(scheduleProcess).observe(document.body, {
			childList: true,
			subtree: true
		});
	}
	function bootstrapPollPoiList() {
		let count = 0;
		const timer = window.setInterval(() => {
			refreshPoiList();
			count += 1;
			if (count >= 20) window.clearInterval(timer);
		}, 500);
	}
	function boot() {
		if (window.__bdmapAddressOverridesReady__) return;
		startBaiduAddressOverrides();
		window.__bdmapAddressOverridesReady__ = true;
	}
	if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", boot, { once: true });
	else boot();
})();
