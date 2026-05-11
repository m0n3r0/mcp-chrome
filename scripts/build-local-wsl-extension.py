#!/usr/bin/env python3
"""Build the local Chrome extension with the stable upstream extension ID.

The WSL/Windows native-messaging setup and native-server register script allow
chrome-extension://hbdgbgagpkpjffpklnamcljpakneikee/. Unpacked WXT builds do not
include a manifest key unless CHROME_EXTENSION_KEY is set, so Chrome assigns a
random extension ID and native messaging refuses to connect.

This helper extracts the public manifest key from the committed upstream release
zip and runs WXT with CHROME_EXTENSION_KEY set, producing a local unpacked build
with the expected extension ID.
"""
import json
import os
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXT_DIR = ROOT / 'app' / 'chrome-extension'
RELEASE_ZIP = ROOT / 'releases' / 'chrome-extension' / 'latest' / 'chrome-mcp-server-lastest.zip'
EXPECTED_ID = 'hbdgbgagpkpjffpklnamcljpakneikee'


def extension_id_from_key(key: str) -> str:
    import base64
    import hashlib
    der = base64.b64decode(key)
    digest = hashlib.sha256(der).digest()[:16]
    return ''.join(chr(ord('a') + (b >> 4)) + chr(ord('a') + (b & 15)) for b in digest)


def main() -> int:
    if not RELEASE_ZIP.exists():
        print(f'Missing release zip with manifest key: {RELEASE_ZIP}', file=sys.stderr)
        return 1
    with zipfile.ZipFile(RELEASE_ZIP) as zf:
        manifest = json.loads(zf.read('manifest.json').decode('utf-8'))
    key = manifest.get('key')
    if not key:
        print(f'Manifest key not found in {RELEASE_ZIP}', file=sys.stderr)
        return 1
    ext_id = extension_id_from_key(key)
    if ext_id != EXPECTED_ID:
        print(f'Unexpected extension ID from key: {ext_id} != {EXPECTED_ID}', file=sys.stderr)
        return 1

    env = os.environ.copy()
    env['CHROME_EXTENSION_KEY'] = key
    print(f'Building Chrome extension with stable ID: {ext_id}')
    return subprocess.call(['npx', 'pnpm@8.15.9', '--filter', 'chrome-mcp-server', 'build'], cwd=ROOT, env=env)


if __name__ == '__main__':
    raise SystemExit(main())
