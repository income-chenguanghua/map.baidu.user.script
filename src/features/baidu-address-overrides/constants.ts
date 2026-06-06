export const STORE_KEY = "bdmap_poi_address_overrides_v1";

export const ITEM_SELECTORS = [
  ".poilist .search-item",
  ".poilist [data-index]",
  ".search-item",
  ".result-item",
  ".poi-item",
  "[class*='search-item']",
  "[class*='result-item']",
] as const;

export const LIST_ROOT_SELECTORS = [
  ".poilist",
  ".search-list",
  ".result-list",
  "[class*='poi-list']",
  "[class*='search-list']",
] as const;

export const UID_LINK_SELECTOR = 'a[href*="uid="]';

export const TITLE_SELECTORS = [
  ".n-blue",
  ".name",
  ".title",
  "[class*='title']",
  "[class*='name']",
  "h3",
  "h4",
  "a[title]",
] as const;

export const ADDRESS_SELECTORS = [
  ".row.addr .n-grey",
  ".row.address .n-grey",
  ".addr .n-grey",
  ".address .n-grey",
  ".addr",
  ".address",
  "[class*='addr'] [class*='grey']",
  "[class*='address'] [class*='grey']",
  "[class*='addr']",
  "[class*='address']",
] as const;

export const CLASS_NAMES = {
  editButton: "tm-edit-addr-btn",
  overriddenAddress: "tm-addr-overridden",
  overriddenTitle: "tm-title-overridden",
  overrideTag: "tm-addr-tag",
  statusWidget: "tm-address-override-status",
  dialogButton: "tm-address-dialog__button",
  dialogButtonPrimary: "tm-address-dialog__button--primary",
  dialogButtonDanger: "tm-address-dialog__button--danger",
} as const;

export const STATUS_WIDGET_ID = "tm-address-override-status";

export const ORIGINAL_ADDRESS_DATA_KEY = "tmOriginalAddress";
export const ORIGINAL_TITLE_DATA_KEY = "tmOriginalTitle";

export const BOOTSTRAP_POLL_INTERVAL_MS = 500;
export const BOOTSTRAP_POLL_LIMIT = 20;
