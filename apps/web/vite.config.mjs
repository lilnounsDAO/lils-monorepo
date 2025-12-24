import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { discordApiPlugin } from './vite-plugin-discord-api.js'
import { ogImagesPlugin } from './vite-plugin-og-images.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(), // Handles path aliases from tsconfig
    discordApiPlugin(), // Handle Discord API proxy in dev
    ogImagesPlugin(), // Handle OG image API routes in dev
    // Remove fs imports from client bundle
    {
      name: 'remove-fs-imports',
      generateBundle(options, bundle) {
        Object.keys(bundle).forEach((fileName) => {
          const file = bundle[fileName];
          if (file.type === 'chunk' && file.code) {
            // Remove fs imports
            file.code = file.code.replace(/import\s+.*?\s+from\s+["']fs["'];?/g, '');
            file.code = file.code.replace(/import\s+.*?\s+from\s+["']node:fs["'];?/g, '');
            file.code = file.code.replace(/import\s+.*?\s+from\s+["']node:fs\/promises["'];?/g, '');
            file.code = file.code.replace(/require\(["']fs["']\)/g, '{}');
            file.code = file.code.replace(/require\(["']node:fs["']\)/g, '{}');
          }
        });
      },
    },
  ],
  
  // Development server configuration optimized for Turborepo
  server: {
    port: 3000,
    host: '0.0.0.0', // Allow access via subdomain (sepolia.localhost)
    open: true,
    hmr: {
      port: 3000, // Use same port for HMR to avoid connection issues
      host: 'localhost', // HMR should connect via localhost
    },
    fs: {
      // Allow serving files from workspace packages
      allow: ['..', '../..'],
    },
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: [
        // Server-only packages that shouldn't be bundled for client
        'sharp',
        'dotenv',
        'fs',
        'path',
        'os',
        'crypto',
        'node:util',
        'node:stream',
        'node:events',
        'node:os',
        'node:path',
        'node:fs',
        'node:fs/promises',
        'node:child_process',
        'node:crypto'
      ],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-popover'],
          charts: ['recharts'],
          web3: ['viem', 'wagmi', '@rainbow-me/rainbowkit'],
          workspace: ['@nouns/types', '@repo/assets'],
        },
      },
    },
    // Increase chunk size limit for large workspace dependencies
    chunkSizeWarningLimit: 1000,
  },
  
  // Resolve configuration for monorepo
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/ui': resolve(__dirname, '../../packages/ui/src'),
      '@/types': resolve(__dirname, '../../packages/types/src'),
      '@/database': resolve(__dirname, '../../packages/database/src'),
      '@/assets': resolve(__dirname, '../../packages/assets/src'),
      // Node.js polyfills for browser compatibility
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util',
      // Stub out Node.js built-ins that shouldn't be in browser
      'fs': false,
      'node:fs': false,
      'node:fs/promises': false,
    },
    dedupe: ['react', 'react-dom'], // Prevent duplicate React instances
  },
  
  // Environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    global: 'globalThis',
  },
  
  // Optimize dependencies for monorepo
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'vaul',
      'lucide-react', 
      'class-variance-authority',
      'buffer',
      'process/browser',
      'util',
    ],
    exclude: [
      // Exclude workspace packages from pre-bundling to enable proper HMR
      '@nouns/types',
      '@repo/assets',
      '@nouns/ui',
      // Exclude server-only packages
      'sharp',
      'dotenv',
    ],
    force: true, // Force optimization on workspace changes
  },
  
  // Workspace-specific configuration
  worker: {
    format: 'es', // Better tree shaking for workspace packages
  },
})