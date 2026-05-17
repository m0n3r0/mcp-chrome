import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  CallToolResult,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import nativeMessagingHostInstance from '../native-messaging-host';
import {
  NativeMessageType,
  TOOL_SCHEMAS,
  filterAllowedToolSchemas,
  getDisabledToolMessage,
  isAllowedMcpTool,
} from 'chrome-mcp-shared';

export const setupTools = (server: Server) => {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: filterAllowedToolSchemas(TOOL_SCHEMAS),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) =>
    handleToolCall(request.params.name, request.params.arguments || {}),
  );
};

const handleToolCall = async (name: string, args: any): Promise<CallToolResult> => {
  try {
    if (!isAllowedMcpTool(name)) {
      return {
        content: [{ type: 'text', text: getDisabledToolMessage(name) }],
        isError: true,
      };
    }

    const response = await nativeMessagingHostInstance.sendRequestToExtensionAndWait(
      { name, args },
      NativeMessageType.CALL_TOOL,
      120000,
    );

    if (response.status === 'success') {
      return response.data;
    }

    return {
      content: [
        {
          type: 'text',
          text: `Error calling tool: ${response.error}`,
        },
      ],
      isError: true,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error calling tool: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
};
