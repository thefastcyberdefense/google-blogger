import {expect,it} from 'vitest';
import {createSingleFlight,MERMAID_URL} from '../../src/scripts/enhancement-loader.ts';
it('uses only the audited exact Mermaid entry',()=>expect(MERMAID_URL).toBe('https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs'));
it('deduplicates concurrent dependency loading',async()=>{let calls=0;const load=createSingleFlight(async()=>{calls++;return 42;});const [a,b]=await Promise.all([load(),load()]);expect([a,b,calls]).toEqual([42,42,1]);});
it('requires explicit retry after a failed load',async()=>{let calls=0;const load=createSingleFlight(async()=>{calls++;if(calls===1)throw new Error('blocked');return 42;});await expect(load()).rejects.toThrow('blocked');await expect(load()).rejects.toThrow('blocked');expect(calls).toBe(1);await expect(load(true)).resolves.toBe(42);});
