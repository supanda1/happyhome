import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Manual type declarations for Node.js globals when @types/node is not available
declare const process: {
  env: Record<string, string | undefined>;
};
declare const __dirname: string;

// Manual path.resolve implementation for when 'path' module types are not available
const resolve = (...paths: string[]): string => {
  // Simple implementation for the specific use case in this config
  return paths.join('/').replace(/\/+/g, '/');
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build configuration
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'terser',
    
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          forms: ['react-hook-form'],
          utils: ['date-fns', 'clsx'],
        },
        // Consistent file naming for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name || '')) {
            return 'assets/images/[name]-[hash].[ext]';
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
            return 'assets/fonts/[name]-[hash].[ext]';
          }
          if (ext === 'css') {
            return 'assets/css/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
    
    // Terser configuration for better minification
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },
    
    // Bundle analysis
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
  },
  
  // Development server configuration
  server: {
    port: 3001,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  
  // Preview server configuration
  preview: {
    port: 3001,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@contexts': resolve(__dirname, 'src/contexts'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types'),
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },
  
  // Environment variables prefix
  envPrefix: 'VITE_',
  
  // CSS configuration
  css: {
    devSourcemap: true,
    postcss: './postcss.config.js',
  },
  
  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-hook-form',
      'date-fns',
      'clsx',
    ],
  },
  
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
