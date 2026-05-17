import { defineBackground } from 'wxt/utils/define-background';
import { initNativeHostListener } from './native-host';

/**
 * Background script entry point for the hardened minimal Chrome MCP profile.
 *
 * Keep this service worker focused on the native-messaging bridge only. Optional
 * product surfaces (semantic indexing, record/replay, web editor, quick panel,
 * context menus, scheduled triggers, and local model cache management) are
 * intentionally not bootstrapped because Hermes only needs the bridge to control
 * the user's real Chrome browser.
 */
export default defineBackground(() => {
  initNativeHostListener();
});
