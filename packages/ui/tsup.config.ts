import { defineConfig } from 'tsup';
import { tsconfigPathsPlugin } from 'esbuild-plugin-tsconfig-paths';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  esbuildOptions(options) {
    options.plugins = [
      ...(options.plugins || []),
      tsconfigPathsPlugin({
        tsconfig: 'tsconfig.json',
      }),
    ];
  },
});