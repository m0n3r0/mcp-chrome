import { defineConfig } from 'wxt';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

const CHROME_EXTENSION_KEY = process.env.CHROME_EXTENSION_KEY;
// Detect dev mode early for manifest-level switches
const IS_DEV = process.env.NODE_ENV !== 'production' && process.env.MODE !== 'production';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  runner: {
    // 方案1: 禁用自动启动（推荐）
    disabled: true,

    // 方案2: 如果要启用自动启动并使用现有配置，取消注释下面的配置
    // chromiumArgs: [
    //   '--user-data-dir=' + homedir() + (process.platform === 'darwin'
    //     ? '/Library/Application Support/Google/Chrome'
    //     : process.platform === 'win32'
    //     ? '/AppData/Local/Google/Chrome/User Data'
    //     : '/.config/google-chrome'),
    //   '--remote-debugging-port=9222',
    // ],
  },
  manifest: {
    // Use environment variable for the key, fallback to undefined if not set
    key: CHROME_EXTENSION_KEY,
    default_locale: 'zh_CN',
    name: '__MSG_extensionName__',
    description: '__MSG_extensionDescription__',
    permissions: ['nativeMessaging', 'tabs', 'activeTab', 'scripting', 'debugger', 'storage'],
    host_permissions: ['http://*/*', 'https://*/*'],
    action: {
      default_popup: 'popup.html',
      default_title: 'Chrome MCP Server',
    },
    web_accessible_resources: [
      {
        resources: ['/inject-scripts/*'],
        matches: ['http://*/*', 'https://*/*'],
      },
    ],
    // 注意：以下安全策略在开发环境会阻断 dev server 的资源加载，
    // 只在生产环境启用，开发环境交由 WXT 默认策略处理。
    ...(IS_DEV
      ? {}
      : {
          cross_origin_embedder_policy: { value: 'require-corp' as const },
          cross_origin_opener_policy: { value: 'same-origin' as const },
          content_security_policy: {
            extension_pages: "script-src 'self'; object-src 'self'; style-src 'self'; img-src 'self' data:;",
          },
        }),
  },
  vite: (env) => ({
    plugins: [
    ],
    build: {
      // 我们的构建产物需要兼容到es6
      target: 'es2015',
      // 非生产环境下生成sourcemap
      sourcemap: env.mode !== 'production',
      // 禁用gzip 压缩大小报告，因为压缩大型文件可能会很慢
      reportCompressedSize: false,
      // chunk大小超过1500kb是触发警告
      chunkSizeWarningLimit: 1500,
      minify: false,
    },
  }),
  hooks: {
    'build:publicAssets': async (_, files) => {
      const fs = await import('fs/promises');
      const staticRoots = ['inject-scripts', '_locales'];

      const walk = async (dir: string): Promise<string[]> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const nested = await Promise.all(
          entries.map(async (entry) => {
            const abs = resolve(dir, entry.name);
            if (entry.isDirectory()) return walk(abs);
            if (!entry.isFile()) return [];
            return [abs];
          }),
        );
        return nested.flat();
      };

      for (const root of staticRoots) {
        const rootAbs = resolve(process.cwd(), root);
        const assets = await walk(rootAbs);
        for (const absoluteSrc of assets) {
          const relativeDest = `${root}/${absoluteSrc.slice(rootAbs.length + 1)}`;
          files.push({ absoluteSrc, relativeDest });
        }
      }
    },
  },
});
