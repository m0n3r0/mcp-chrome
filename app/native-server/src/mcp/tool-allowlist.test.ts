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
  ];

  test('allows only the minimal browser-driving tools', () => {
    expect(Array.from(MINIMAL_MCP_TOOL_NAMES).sort()).toEqual([...allowedTools].sort());
    for (const toolName of allowedTools) {
      expect(isAllowedMcpTool(toolName)).toBe(true);
    }
  });

  test('blocks removed and unknown tool surfaces by name', () => {
    for (const toolName of [
      'chrome_javascript',
      'chrome_history',
      'chrome_bookmark_search',
      'chrome_bookmark_add',
      'chrome_bookmark_delete',
      'chrome_network_request',
      'chrome_network_capture',
      'chrome_userscript',
      'chrome_upload_file',
      'chrome_handle_download',
      'chrome_gif_recorder',
      'performance_start_trace',
      'performance_stop_trace',
      'performance_analyze_insight',
      'record_replay_flow_run',
      'record_replay_list_published',
      'flow.some_published_flow',
    ]) {
      expect(isAllowedMcpTool(toolName)).toBe(false);
    }
  });

  test('filters advertised schemas to the minimal profile', () => {
    const filteredNames = filterAllowedToolSchemas(TOOL_SCHEMAS).map((tool) => tool.name).sort();
    expect(filteredNames).toEqual([...allowedTools].sort());
  });
});
