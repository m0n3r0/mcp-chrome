export type ActionType =
  | 'navigate'
  | 'click'
  | 'right_click'
  | 'double_click'
  | 'triple_click'
  | 'drag'
  | 'scroll'
  | 'type'
  | 'key'
  | 'fill'
  | 'hover'
  | 'wait'
  | 'other';

export interface ActionMetadata {
  type: ActionType;
  timestampMs?: number;
  coordinates?: { x: number; y: number };
  startCoordinates?: { x: number; y: number };
  endCoordinates?: { x: number; y: number };
  text?: string;
  selector?: string;
  value?: string;
  direction?: string;
  amount?: number;
  durationMs?: number;
  url?: string;
  coordinateSpace?: 'viewport' | 'screenshot';
  ref?: string;
  startRef?: string;
}

/**
 * GIF auto-capture is intentionally disabled in the hardened minimal profile.
 * Keeping no-op exports preserves the computer/navigate tool contracts while
 * avoiding offscreen documents, downloads permission, GIF encoders, and worker
 * supply-chain surface.
 */
export function isAutoCaptureActive(_tabId: number): boolean {
  return false;
}

export async function captureFrameOnAction(
  _tabId: number,
  _metadata: ActionMetadata,
): Promise<void> {
  return;
}
