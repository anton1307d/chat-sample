import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@components': path.resolve(__dirname, './src/components'),
            '@hooks': path.resolve(__dirname, './src/hooks'),
            '@lib': path.resolve(__dirname, './src/lib'),
            '@types': path.resolve(__dirname, './src/types'),
        },
    },
    server: {
        host: '0.0.0.0', // Add this for Docker
        port: 3001,
        watch: {
            usePolling: true, // Important for Docker
        },
        hmr: {
            host: 'localhost',
        },
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
});
