import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const proxyTarget = process.env.VITE_PROXY_TARGET ?? 'http://nginx:80';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: { '@': path.resolve(__dirname, './src') },
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: false,
        chunkSizeWarningLimit: 800,
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        proxy: {
            '/api':     { target: proxyTarget, changeOrigin: true },
            '/healthz': { target: proxyTarget, changeOrigin: true },
        },
    },
});
