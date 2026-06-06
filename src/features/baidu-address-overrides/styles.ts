import { GM_addStyle } from "$";

let installed = false;

export function installAddressOverrideStyles(): void {
  if (installed) {
    return;
  }

  GM_addStyle(`
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

    .tm-addr-overridden,
    .tm-title-overridden {
      color: #cf222e !important;
      font-weight: 500;
    }

    .tm-poi-editable {
      cursor: pointer !important;
      outline: 1px solid transparent;
      outline-offset: -1px;
      transition:
        background 120ms ease,
        outline-color 120ms ease;
    }

    .tm-poi-editable:hover {
      background: #f6f8fa !important;
      outline-color: #0969da;
    }

    .tm-addr-tag {
      display: inline-flex;
      align-items: center;
      height: 20px;
      margin-left: 6px;
      padding: 0 7px;
      border: 1px solid #d0d7de;
      border-radius: 999px;
      background: #f6f8fa;
      color: #57606a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12px;
      line-height: 18px;
    }

    .tm-address-override-status {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 2147483646;
      display: inline-flex;
      flex-direction: column;
      align-items: center;
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
    }

    .tm-address-override-status__action {
      display: block;
      font-size: 12px;
      font-weight: 600;
      line-height: 14px;
    }

    .tm-address-override-status__version {
      display: block;
      color: #57606a;
      font-size: 10px;
      font-weight: 500;
      line-height: 12px;
    }

    .tm-address-override-status:hover {
      background: #f3f4f6;
      border-color: #afb8c1;
    }

    .tm-address-override-status.is-empty {
      color: #57606a;
    }

    .tm-address-override-status.is-editing {
      border-color: rgba(27, 31, 36, 0.15);
      background: #2da44e;
      color: #ffffff;
    }

    .tm-address-override-status.is-editing .tm-address-override-status__version {
      color: rgba(255, 255, 255, 0.82);
    }

    .tm-address-override-status.is-editing:hover {
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
  `);

  installed = true;
}
