import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    return {
        // PERBAIKAN 1: Menambahkan base: './' untuk mengatasi error 404 asset di Vercel
        base: './', 

        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        
        plugins: [react()],
        
        // CATATAN: Bagian 'define' dan 'resolve' yang bermasalah sudah dihapus
    };
});
