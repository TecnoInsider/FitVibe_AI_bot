import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // FIX: Replaced `process.cwd()` with `.` inside `path.resolve` to avoid a TypeScript type error.
          // This is functionally equivalent and resolves the alias to the project root.
          '@': path.resolve('.'),
        }
      }
    };
});