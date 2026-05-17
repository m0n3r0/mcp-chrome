import { describe, expect, test, beforeEach } from '@jest/globals';
import { existsSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { FastifyRequest } from 'fastify';
import {
  buildAuthHeaders,
  extractAuthToken,
  getAuthTokenFilePath,
  getOrCreateAuthToken,
  isAuthorizedRequest,
  resetAuthTokenForTests,
} from './auth';

function mockRequest(input: {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
}): FastifyRequest {
  return {
    method: input.method ?? 'GET',
    url: input.url ?? '/agent/engines',
    headers: input.headers ?? {},
  } as FastifyRequest;
}

describe('local server authentication', () => {
  const tokenPath = join(tmpdir(), `chrome-mcp-auth-test-${process.pid}`);

  beforeEach(() => {
    resetAuthTokenForTests();
    process.env.CHROME_MCP_AUTH_TOKEN_FILE = tokenPath;
    try {
      unlinkSync(tokenPath);
    } catch {
      // Ignore missing test token file.
    }
  });

  test('generates a stable process-local auth token', () => {
    const first = getOrCreateAuthToken();
    const second = getOrCreateAuthToken();

    expect(first).toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(32);
  });



  test('persists generated token to a restrictive per-user token file', () => {
    const token = getOrCreateAuthToken();
    expect(getAuthTokenFilePath()).toBe(tokenPath);
    expect(existsSync(tokenPath)).toBe(true);
    expect(readFileSync(tokenPath, 'utf8').trim()).toBe(token);
    if (process.platform !== 'win32') {
      expect(statSync(tokenPath).mode & 0o777).toBe(0o600);
    }

    resetAuthTokenForTests();
    process.env.CHROME_MCP_AUTH_TOKEN_FILE = tokenPath;
    expect(getOrCreateAuthToken()).toBe(token);
  });

  test('extracts auth token only from explicit headers', () => {
    expect(extractAuthToken(mockRequest({ headers: buildAuthHeaders('secret-token') }))).toBe(
      'secret-token',
    );

    expect(
      extractAuthToken(
        {
          ...mockRequest({ url: '/mcp?authToken=query-secret' }),
          query: { authToken: 'query-secret' },
        } as FastifyRequest,
      ),
    ).toBe(null);

    expect(
      extractAuthToken(mockRequest({ headers: { authorization: 'Bearer bearer-secret' } })),
    ).toBe('bearer-secret');
  });

  test('keeps health checks public but requires a token for extension-origin routes', () => {
    expect(isAuthorizedRequest(mockRequest({ url: '/ping' }))).toBe(true);
    expect(
      isAuthorizedRequest(
        mockRequest({
          url: '/mcp',
          headers: { origin: 'chrome-extension://example-extension' },
        }),
      ),
    ).toBe(false);
    expect(isAuthorizedRequest(mockRequest({ url: '/mcp' }))).toBe(false);
  });



  test('does not trust localhost-looking CORS origin prefixes', async () => {
    const token = getOrCreateAuthToken();
    const { Server } = await import('./index');
    const server = new Server();
    const app = server.getInstance();

    const spoofed = await app.inject({
      method: 'OPTIONS',
      url: '/mcp',
      headers: {
        origin: 'http://127.0.0.1.attacker.invalid',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'x-chrome-mcp-auth',
      },
    });
    expect(spoofed.headers['access-control-allow-origin']).toBeUndefined();

    const localhost = await app.inject({
      method: 'OPTIONS',
      url: '/mcp',
      headers: {
        origin: 'http://127.0.0.1:5173',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'x-chrome-mcp-auth',
        ...buildAuthHeaders(token),
      },
    });
    expect(localhost.headers['access-control-allow-origin']).toBe('http://127.0.0.1:5173');
  });

  test('accepts protected routes with the generated auth token', () => {
    const token = getOrCreateAuthToken();

    expect(
      isAuthorizedRequest(
        mockRequest({
          url: '/mcp',
          headers: buildAuthHeaders(token),
        }),
      ),
    ).toBe(true);
  });
});
