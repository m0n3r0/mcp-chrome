#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import {
  tryRegisterUserLevelHost,
  colorText,
  registerWithElevatedPermissions,
  ensureExecutionPermissions,
  writeNodePathFile,
} from './scripts/utils';
import { BrowserType, parseBrowserType, detectInstalledBrowsers } from './scripts/browser-config';

const version = require('../package.json').version;

function printHelp(): void {
  console.log(`mcp-chrome-bridge ${version}\n\nCommands:\n  register [--force] [--system] [--browser chrome|chromium|all] [--detect]\n  fix-permissions\n  update-port <port>\n  help\n`);
}

function getOptionValue(args: string[], longName: string, shortName?: string): string | undefined {
  const longEq = `--${longName}=`;
  const long = `--${longName}`;
  const short = shortName ? `-${shortName}` : undefined;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith(longEq)) return arg.slice(longEq.length);
    if (arg === long || (short && arg === short)) return args[i + 1];
  }
  return undefined;
}

function hasFlag(args: string[], longName: string, shortName?: string): boolean {
  const long = `--${longName}`;
  const short = shortName ? `-${shortName}` : undefined;
  return args.includes(long) || Boolean(short && args.includes(short));
}

async function register(args: string[]): Promise<void> {
  writeNodePathFile(__dirname);

  let targetBrowsers: BrowserType[] | undefined;
  const browser = getOptionValue(args, 'browser', 'b');
  if (browser) {
    if (browser.toLowerCase() === 'all') {
      targetBrowsers = [BrowserType.CHROME, BrowserType.CHROMIUM];
      console.log(colorText('Registering for all supported browsers...', 'blue'));
    } else {
      const browserType = parseBrowserType(browser);
      if (!browserType) throw new Error(`Invalid browser: ${browser}. Use chrome, chromium, or all`);
      targetBrowsers = [browserType];
    }
  } else if (hasFlag(args, 'detect', 'd')) {
    targetBrowsers = detectInstalledBrowsers();
    if (targetBrowsers.length === 0) {
      console.log(colorText('No supported browsers detected, defaulting to Chrome/Chromium', 'yellow'));
      targetBrowsers = undefined;
    }
  }

  const isRoot = Boolean(process.getuid && process.getuid() === 0);
  if (hasFlag(args, 'system', 's') || isRoot) {
    await registerWithElevatedPermissions();
    console.log(colorText('System-level Native Messaging host registered successfully!', 'green'));
    return;
  }

  console.log(colorText('Registering user-level Native Messaging host...', 'blue'));
  const success = await tryRegisterUserLevelHost(targetBrowsers);
  if (!success) {
    throw new Error('User-level registration failed; retry with --system or elevated permissions');
  }
  console.log(colorText('Native Messaging host registered successfully!', 'green'));
}

async function fixPermissions(): Promise<void> {
  console.log(colorText('Fixing execution permissions...', 'blue'));
  await ensureExecutionPermissions();
  console.log(colorText('✓ Execution permissions fixed successfully!', 'green'));
}

function updatePort(port: string | undefined): void {
  const portNumber = Number.parseInt(String(port || ''), 10);
  if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
    throw new Error('Port must be a valid number between 1 and 65535');
  }
  const configPath = path.join(__dirname, 'mcp', 'stdio-config.json');
  if (!fs.existsSync(configPath)) throw new Error(`Configuration file not found at ${configPath}`);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const currentUrl = new URL(config.url);
  currentUrl.port = String(portNumber);
  config.url = currentUrl.toString();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
  console.log(colorText(`✓ Port updated successfully to ${portNumber}`, 'green'));
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  try {
    switch (command) {
      case 'register':
        await register(args);
        break;
      case 'fix-permissions':
        await fixPermissions();
        break;
      case 'update-port':
        updatePort(args[0]);
        break;
      case 'help':
      case '--help':
      case '-h':
      case undefined:
        printHelp();
        break;
      case '--version':
      case '-V':
        console.log(version);
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error: any) {
    console.error(colorText(error?.message || String(error), 'red'));
    process.exit(1);
  }
}

void main();
