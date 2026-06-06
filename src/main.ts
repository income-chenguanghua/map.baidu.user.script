import { startBaiduAddressOverrides } from "./features/baidu-address-overrides";

declare global {
  interface Window {
    __bdmapAddressOverridesReady__?: boolean;
  }
}

function boot(): void {
  if (window.__bdmapAddressOverridesReady__) {
    return;
  }

  startBaiduAddressOverrides();
  window.__bdmapAddressOverridesReady__ = true;
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
