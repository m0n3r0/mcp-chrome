import { createErrorResponse } from '@/common/tool-handler';
import { ERROR_MESSAGES } from '@/common/constants';
import { getDisabledToolMessage, isAllowedMcpTool } from 'chrome-mcp-shared';
import * as browserTools from './browser';

const tools = { ...browserTools } as any;

/**
 * Tool call parameter interface
 */
export interface ToolCallParam {
  name: string;
  args: any;
}

/**
 * Handle tool call from native host
 */
export const handleCallTool = async (param: ToolCallParam) => {
  if (!isAllowedMcpTool(param.name)) {
    return createErrorResponse(getDisabledToolMessage(param.name));
  }

  const tool = Object.values(tools).find((t: any) => t.name === param.name) as any;
  if (!tool) {
    return createErrorResponse(`Tool ${param.name} not found`);
  }

  try {
    return await tool.execute(param.args);
  } catch (error) {
    console.error(`Tool execution failed for ${param.name}:`, error);
    return createErrorResponse(
      `${ERROR_MESSAGES.TOOL_EXECUTION_FAILED}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
