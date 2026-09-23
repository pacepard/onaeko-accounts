import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Source imports `@onaeko/ui/*`. The published kit is still `@pacepard/ui`
 * (same package pacepard-accounts uses). Rewrite the id and let Vite resolve
 * through package.exports + dep optimization — do not return absolute paths
 * (that bypasses React dedupe and breaks jsx-runtime).
 */
function onaekoUiToPacepardUi(): Plugin {
    return {
        name: 'onaeko-ui-to-pacepard-ui',
        enforce: 'pre',
        async resolveId(id, importer, options) {
            if (id !== '@onaeko/ui' && !id.startsWith('@onaeko/ui/')) {
                return null;
            }
            const rewritten = id.replace(/^@onaeko\/ui/, '@pacepard/ui');
            return this.resolve(rewritten, importer, {
                ...options,
                skipSelf: true,
            });
        },
    };
}

export default defineConfig({
    plugins: [onaekoUiToPacepardUi(), react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(rootDir, 'src'),
        },
        dedupe: ['react', 'react-dom'],
    },
    server: {
        port: 5401,
        strictPort: true,
        fs: {
            allow: [
                rootDir,
                path.resolve(rootDir, 'node_modules/@pacepard/ui'),
            ],
        },
    },
    preview: {
        port: 5401,
        strictPort: true,
    },
});
