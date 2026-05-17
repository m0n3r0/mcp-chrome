<template>
  <main class="popup">
    <h1>Chrome MCP</h1>
    <p>Hardened minimal bridge for Hermes browser control.</p>
    <p class="status">{{ status }}</p>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NativeMessageType } from 'chrome-mcp-shared';

const status = ref('Checking native host...');

onMounted(async () => {
  try {
    const response = await chrome.runtime.sendMessage({ type: NativeMessageType.PING_NATIVE });
    status.value = response?.connected ? 'Native host connected.' : 'Native host not connected yet.';
  } catch (error) {
    status.value = `Status unavailable: ${error instanceof Error ? error.message : String(error)}`;
  }
});
</script>

<style scoped>
.popup {
  box-sizing: border-box;
  min-width: 280px;
  padding: 16px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #f8fafc;
  background: #0f172a;
}

h1 {
  margin: 0 0 8px;
  font-size: 18px;
}

p {
  margin: 6px 0;
  color: #cbd5e1;
}

.status {
  color: #93c5fd;
}
</style>
