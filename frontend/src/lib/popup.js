const POPUP_EVENT_NAME = 'sms:popup';

export function getPopupEventName() {
  return POPUP_EVENT_NAME;
}

export function showPopup(message, options = {}) {
  if (typeof window === 'undefined' || !message) return;

  window.dispatchEvent(
    new CustomEvent(POPUP_EVENT_NAME, {
      detail: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message,
        type: options.type || 'error',
        durationMs: options.durationMs || 3500,
      },
    })
  );
}
