import { fileURLToPath } from 'node:url';

/** Runnable test-first checkpoint; validation intentionally absent. */
export function validateSnapshot(_snapshot: unknown): string[] { return []; }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('N1 data-only finalizer checkpoint: validation not implemented');
}
