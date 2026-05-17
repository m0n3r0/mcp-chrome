// Minimal message type constants for the hardened Hermes Chrome bridge.

export const BACKGROUND_MESSAGE_TYPES = {
  GET_SERVER_STATUS: 'get_server_status',
  REFRESH_SERVER_STATUS: 'refresh_server_status',
  SERVER_STATUS_CHANGED: 'server_status_changed',
} as const;

// Tool action message types (for chrome.tabs.sendMessage / chrome.runtime.sendMessage)
export const TOOL_MESSAGE_TYPES = {
  // Screenshot related
  SCREENSHOT_PREPARE_PAGE_FOR_CAPTURE: 'preparePageForCapture',
  SCREENSHOT_GET_PAGE_DETAILS: 'getPageDetails',
  SCREENSHOT_GET_ELEMENT_DETAILS: 'getElementDetails',
  SCREENSHOT_SCROLL_PAGE: 'scrollPage',
  SCREENSHOT_RESET_PAGE_AFTER_CAPTURE: 'resetPageAfterCapture',

  // Web content fetching
  WEB_FETCHER_GET_HTML_CONTENT: 'getHtmlContent',
  WEB_FETCHER_GET_TEXT_CONTENT: 'getTextContent',

  // User interactions
  CLICK_ELEMENT: 'clickElement',
  FILL_ELEMENT: 'fillElement',
  SIMULATE_KEYBOARD: 'simulateKeyboard',

  // Interactive elements
  GET_INTERACTIVE_ELEMENTS: 'getInteractiveElements',

  // Accessibility tree
  GENERATE_ACCESSIBILITY_TREE: 'generateAccessibilityTree',
  RESOLVE_REF: 'resolveRef',
  ENSURE_REF_FOR_SELECTOR: 'ensureRefForSelector',
  VERIFY_FINGERPRINT: 'verifyFingerprint',
  DISPATCH_HOVER_FOR_REF: 'dispatchHoverForRef',

  // Wait helper
  WAIT_FOR_TEXT: 'waitForText',
} as const;

export type BackgroundMessageType =
  (typeof BACKGROUND_MESSAGE_TYPES)[keyof typeof BACKGROUND_MESSAGE_TYPES];
export type ToolMessageType = (typeof TOOL_MESSAGE_TYPES)[keyof typeof TOOL_MESSAGE_TYPES];
