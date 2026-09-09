import {expect,it} from 'vitest';
import {prepareDiagram,diagramConfig} from '../../src/scripts/diagrams.ts';
const source='flowchart TD\naccTitle: Boundary\naccDescr: A request crosses a boundary\nA[Contractor] --> B[Policy]';
it('preserves ordinary diagram text including Contractor',()=>expect(prepareDiagram(source)).toBe(source));
it('strict config cannot be overridden by post configuration',()=>{expect(diagramConfig('dark').securityLevel).toBe('strict');expect(()=>prepareDiagram('%%{init: {"securityLevel":"loose"}}%%\n'+source)).toThrow();expect(()=>prepareDiagram('---\nconfig: {}\n---\n'+source)).toThrow();});
it('requires meaningful diagram descriptions',()=>expect(()=>prepareDiagram('flowchart TD\nA-->B')).toThrow());
it('bounds oversized source',()=>expect(()=>prepareDiagram(source+'x'.repeat(20001))).toThrow());
it('legacy normalization is opt-in and retains a valid diagram header',()=>expect(prepareDiagram('sequenceDiagram\n'+source,true)).toBe(source));
