import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { HTTP_STATUS } from '../constant';

export const AUTH_TOKEN_ENV = 'CHROME_MCP_AUTH_TOKEN';
export const AUTH_HEADER = 'x-chrome-mcp-auth';
export const AUTH_SCHEME = 'Bearer';
export const AUTH_EXEMPT_PATHS = new Set(['/ping']);

const AUTH_TOKEN_BYTES = 32;
const TOKEN_FILE_MODE = 0o600;
let cachedToken: string | null = null;

export function getAuthTokenFilePath(): string {
  const override = process.env.CHROME_MCP_AUTH_TOKEN_FILE?.trim();
  if (override) {
    return override;
  }

  const baseDir =
    process.platform === 'win32'
      ? process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local')
      : process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
  return join(baseDir, 'mcp-chrome', 'auth-token');
}

function readAuthTokenFile(): string | null {
  try {
    const tokenPath = getAuthTokenFilePath();
    if (!existsSync(tokenPath)) {
      return null;
    }
    const token = readFileSync(tokenPath, 'utf8').trim();
    return token || null;
  } catch {
    return null;
  }
}

function writeAuthTokenFile(token: string): void {
  const tokenPath = getAuthTokenFilePath();
  mkdirSync(dirname(tokenPath), { recursive: true, mode: 0o700 });
  writeFileSync(tokenPath, `${token}\n`, { mode: TOKEN_FILE_MODE });
  try {
    chmodSync(tokenPath, TOKEN_FILE_MODE);
  } catch {
    // Best effort on platforms/filesystems without POSIX chmod support.
  }
}

function generateAuthToken(): string {
  return randomBytes(AUTH_TOKEN_BYTES).toString('base64url');
}

export function getOrCreateAuthToken(): string {
  const existing = process.env[AUTH_TOKEN_ENV]?.trim();
  if (existing) {
    cachedToken = existing;
    return existing;
  }

  if (cachedToken) {
    return cachedToken;
  }

  const fromFile = readAuthTokenFile();
  if (fromFile) {
    cachedToken = fromFile;
    process.env[AUTH_TOKEN_ENV] = cachedToken;
    return cachedToken;
  }

  cachedToken = generateAuthToken();
  process.env[AUTH_TOKEN_ENV] = cachedToken;
  writeAuthTokenFile(cachedToken);
  return cachedToken;
}

export function resetAuthTokenForTests(): void {
  cachedToken = null;
  delete process.env[AUTH_TOKEN_ENV];
  delete process.env.CHROME_MCP_AUTH_TOKEN_FILE;
}

function constantTimeEquals(a: string, b: string): boolean {
  const aHash = createHash('sha256').update(a).digest();
  const bHash = createHash('sha256').update(b).digest();
  return timingSafeEqual(aHash, bHash);
}

export function extractAuthToken(request: FastifyRequest): string | null {
  const headerValue = request.headers[AUTH_HEADER];
  if (Array.isArray(headerValue)) {
    return headerValue[0]?.trim() || null;
  }
  if (typeof headerValue === 'string' && headerValue.trim()) {
    return headerValue.trim();
  }

  const authorization = request.headers.authorization;
  if (typeof authorization === 'string' && authorization.trim()) {
    const trimmed = authorization.trim();
    const prefix = `${AUTH_SCHEME} `;
    if (trimmed.toLowerCase().startsWith(prefix.toLowerCase())) {
      return trimmed.slice(prefix.length).trim() || null;
    }
  }

  return null;
}

export function isAuthorizedRequest(request: FastifyRequest): boolean {
  if (request.method === 'OPTIONS') {
    return true;
  }

  if (AUTH_EXEMPT_PATHS.has(request.url.split('?')[0])) {
    return true;
  }

  const expected = getOrCreateAuthToken();
  const provided = extractAuthToken(request);
  return Boolean(provided && constantTimeEquals(provided, expected));
}

export async function requireLocalAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (isAuthorizedRequest(request)) {
    return;
  }

  await reply.status(HTTP_STATUS.UNAUTHORIZED).send({ error: 'Unauthorized' });
}

export function buildAuthHeaders(token = getOrCreateAuthToken()): Record<string, string> {
  return {
    [AUTH_HEADER]: token,
    Authorization: `${AUTH_SCHEME} ${token}`,
  };
}
