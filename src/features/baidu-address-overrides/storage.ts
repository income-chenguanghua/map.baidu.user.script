import { GM_getValue, GM_setValue } from "$";
import { STORE_KEY } from "./constants";
import type { AddressOverrideRecord, AddressOverrideStore } from "./types";

export function loadOverrideStore(): AddressOverrideStore {
  try {
    const value = getStorageValue();
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }

    return value;
  } catch (error) {
    console.warn("[BDMap Address Override] load error:", error);
    return {};
  }
}

function saveOverrideStore(store: AddressOverrideStore): void {
  try {
    setStorageValue(store);
  } catch (error) {
    console.warn("[BDMap Address Override] save error:", error);
  }
}

export function saveAddressOverride(
  key: string,
  record: AddressOverrideRecord
): void {
  const store = loadOverrideStore();
  store[key] = record;
  saveOverrideStore(store);
}

export function removeAddressOverride(key: string): void {
  const store = loadOverrideStore();
  delete store[key];
  saveOverrideStore(store);
}

export function clearAddressOverrides(): void {
  saveOverrideStore({});
}

function getStorageValue(): AddressOverrideStore {
  if (typeof GM_getValue === "function") {
    return GM_getValue<AddressOverrideStore>(STORE_KEY, {});
  }

  const rawValue = window.localStorage.getItem(STORE_KEY);
  if (!rawValue) {
    return {};
  }

  return JSON.parse(rawValue) as AddressOverrideStore;
}

function setStorageValue(store: AddressOverrideStore): void {
  if (typeof GM_setValue === "function") {
    GM_setValue(STORE_KEY, store);
    return;
  }

  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}
