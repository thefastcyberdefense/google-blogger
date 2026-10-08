import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tests/fcd/**/*.test.ts'], environment: 'node', chaiConfig: { truncateThreshold: 0 } } });
