import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router-dom')) return 'react-core';
            if (id.includes('framer-motion'))                                  return 'motion';
            if (id.includes('lucide-react'))                                   return 'icons';
            if (id.includes('i18next'))                                        return 'i18n';
            if (id.includes('@reduxjs') || id.includes('react-redux'))        return 'redux';
            if (id.includes('date-fns'))                                       return 'date-fns';
            if (id.includes('aos'))                                            return 'aos';
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.grandebeach.com',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://api.grandebeach.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
