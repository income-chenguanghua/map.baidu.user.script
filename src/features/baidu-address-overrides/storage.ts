import { GM_getValue, GM_setValue } from "$";
import { STORE_KEY } from "./constants";
import type { AddressOverrideRecord, AddressOverrideStore } from "./types";

export function loadOverrideStore(): AddressOverrideStore {
  try {
    const value = GM_getValue<AddressOverrideStore>(STORE_KEY, {});
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
  GM_setValue(STORE_KEY, store);
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
