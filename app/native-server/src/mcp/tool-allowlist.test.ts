import {
  MINIMAL_MCP_TOOL_NAMES,
  TOOL_NAMES,
  filterAllowedToolSchemas,
  isAllowedMcpTool,
} from 'chrome-mcp-shared';
import { TOOL_SCHEMAS } from 'chrome-mcp-shared';

describe('minimal MCP tool allowlist', () => {
  const allowedTools = [
    TOOL_NAMES.BROWSER.GET_WINDOWS_AND_TABS,
    TOOL_NAMES.BROWSER.NAVIGATE,
    TOOL_NAMES.BROWSER.READ_PAGE,
    TOOL_NAMES.BROWSER.WEB_FETCHER,
    TOOL_NAMES.BROWSER.COMPUTER,
    TOOL_NAMES.BROWSER.SWITCH_TAB,
    TOOL_NAMES.BROWSER.HANDLE_DIALOG,
    TOOL_NAMES.BROWSER.JAVASCRIPT,
  ];

  const blockedTools = [
    TOOL_NAMES.BROWSER.HISTORY,
    TOOL_NAMES.BROWSER.BOOKMARK_SEARCH,
    TOOL_NAMES.BROWSER.BOOKMARK_ADD,
    TOOL_NAMES.BROWSER.BOOKMARK_DELETE,
    TOOL_NAMES.BROWSER.NETWORK_REQUEST,
    TOOL_NAMES.BROWSER.NETWORK_CAPTURE,
    TOOL_NAMES.BROWSER.USERSCRIPT,
    TOOL_NAMES.BROWSER.FILE_UPLOAD,
    TOOL_NAMES.BROWSER.HANDLE_DOWNLOAD,
    TOOL_NAMES.BROWSER.GIF_RECORDER,
    TOOL_NAMES.BROWSER.PERFORMANCE_START_TRACE,
    TOOL_NAMES.BROWSER.PERFORMANCE_STOP_TRACE,
    TOOL_NAMES.BROWSER.PERFORMANCE_ANALYZE_INSIGHT,
    TOOL_NAMES.RECORD_REPLAY.FLOW_RUN,
    TOOL_NAMES.RECORD_REPLAY.LIST_PUBLISHED,
    'flow.some_published_flow',
  ];

  test('allows only the minimal browser-driving tools', () => {
    expect(Array.from(MINIMAL_MCP_TOOL_NAMES).sort()).toEqual([...allowedTools].sort());
    for (const toolName of allowedTools) {
      expect(isAllowedMcpTool(toolName)).toBe(true);
    }
  });

  test('blocks high-risk and unused tool surfaces', () => {
    for (const toolName of blockedTools) {
      expect(isAllowedMcpTool(toolName)).toBe(false);
    }
  });

  test('filters advertised schemas to the minimal profile', () => {
    const filteredNames = filterAllowedToolSchemas(TOOL_SCHEMAS).map((tool) => tool.name).sort();
    expect(filteredNames).toEqual([...allowedTools].sort());
  });
});
