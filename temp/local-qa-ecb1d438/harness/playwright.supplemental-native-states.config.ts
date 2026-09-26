import { defineConfig } from '../checkout/node_modules/@playwright/test/index.mjs';

const themes = ['light', 'dark'] as const;

export default defineConfig({
  testDir: '../checkout/tests/render',
  testMatch: '**/native-states.spec.ts',
  outputDir: '../evidence/supplemental-output',
  timeout: 45000,
  fullyParallel: true,
  retries: 0,
  workers: 4,
  reporter: [
    ['list'],
    ['json', { outputFile: '../evidence/supplemental/native-states-cross-engine.json' }]
  ],
  use: {
    baseURL: 'https://blogs.fastcyberdefense.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: (['firefox', 'webkit'] as const).flatMap((browserName) =>
    [390, 1280].flatMap((width) =>
      themes.map((colorScheme) => ({
        name: `supplemental-${browserName}-${width}-${colorScheme}`,
        use: {
          browserName,
          viewport: { width, height: 900 },
          colorScheme
        }
      }))
    )
  )
});
