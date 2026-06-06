export interface AddressOverrideRecord {
  title: string;
  address: string;
  originalTitle?: string;
  originalAddress: string;
  uid: string | null;
  updatedAt: number;
}

export type AddressOverrideStore = Record<string, AddressOverrideRecord>;

export interface PoiContext {
  item: HTMLElement;
  titleEl: HTMLElement | null;
  addressEl: HTMLElement;
  key: string;
  uid: string | null;
  currentTitle: string;
  originalTitle: string;
  originalAddress: string;
}
