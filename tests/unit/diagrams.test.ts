import {expect,it} from 'vitest';
import {prepareDiagram,diagramConfig} from '../../src/scripts/diagrams.ts';
const source='flowchart TD\naccTitle: Boundary\naccDescr: A request crosses a boundary\nA[Contractor] --> B[Policy]';
it('preserves ordinary diagram text including Contractor',()=>expect(prepareDiagram(source)).toBe(source));
it('strict config cannot be overridden by post configuration',()=>{expect(diagramConfig('dark').securityLevel).toBe('strict');expect(()=>prepareDiagram('%%{init: {"securityLevel":"loose"}}%%\n'+source)).toThrow();expect(()=>prepareDiagram('---\nconfig: {}\n---\n'+source)).toThrow();});
it('requires meaningful diagram descriptions',()=>expect(()=>prepareDiagram('flowchart TD\nA-->B')).toThrow());
it('bounds oversized source',()=>expect(()=>prepareDiagram(source+'x'.repeat(20001))).toThrow());
it('legacy normalization is opt-in and retains a valid diagram header',()=>expect(prepareDiagram('sequenceDiagram\n'+source,true)).toBe(source));

// Characterize FCD's existing restricted policy, not Ledger's general repair parser.
it.each([
 ['&amp;gt;','&gt;'],
 ['&amp;lt;','&lt;'],
 ['&amp;amp;gt;','&amp;gt;'],
 ['&quot;','&quot;'],
 ['&#x3c;','&#x3c;']
])('legacy normalization does not recursively decode %s', (encoded,expected)=>{
 const raw=source+`\n%% literal ${encoded}`;
 expect(prepareDiagram(raw,true)).toBe(source+`\n%% literal ${expected}`);
 expect(prepareDiagram(raw,false)).toBe(raw);
});
it('legacy arrow normalization decodes one supported layer only',()=>{
 const encoded=source.replace('-->','--&gt;');
 expect(prepareDiagram(encoded)).toBe(encoded);
 expect(prepareDiagram(encoded,true)).toBe(source);
});
it.each(['sequenceDiagramSuffix','flowchartSuffix','graphical','architecture-betaSuffix'])('rejects malformed first header token %s',header=>{
 expect(()=>prepareDiagram(source.replace('flowchart',header),true)).toThrow(/Unsupported diagram type/);
});
it('does not auto-heal headers separated by comments or repair unmarked source',()=>{
 const duplicate='sequenceDiagram\n'+source;
 expect(prepareDiagram(duplicate)).toBe(duplicate);
 const commented='sequenceDiagram\n%% original author comment\n'+source;
 expect(prepareDiagram(commented,true)).toBe(commented);
 // Passing preparation here is not a claim that Mermaid accepts duplicate headers.
});
it('accepts exactly the source limit and rejects one extra character before trimming',()=>{
 const prefix=source+'\n%% ';
 const bounded=prefix+'x'.repeat(20000-prefix.length);
 expect(bounded.length).toBe(20000);
 expect(prepareDiagram(bounded)).toBe(bounded);
 expect(()=>prepareDiagram(bounded+' ')).toThrow(/20,000/);
});
it('preserves long internal whitespace and comment sequences within the source bound',()=>{
 const raw=source+'\n'+(' \t%% repeated author comment\n').repeat(400)+'%% end';
 expect(raw.length).toBeLessThan(20000);
 expect(prepareDiagram(raw,true)).toBe(raw);
 // No wall-clock performance threshold or claim of a hard CPU interrupt.
});
it.each(['%%{init: {"securityLevel":"loose"}}%%','%%   {init: {"htmlLabels":true}}%%','---\nconfig: {}\n---'])('rejects configuration after a long comment prefix: %s',config=>{
 const raw=source+'\n'+('%% harmless\n').repeat(500)+config;
 expect(raw.length).toBeLessThan(20000);
 expect(()=>prepareDiagram(raw,true)).toThrow(/configuration is disabled/);
});
it.each(['light','dark'])('retains strict security and input limits in %s mode',theme=>{
 const config=diagramConfig(theme);
 expect(config).toMatchObject({securityLevel:'strict',htmlLabels:false,maxTextSize:20000,maxEdges:200,flowchart:{htmlLabels:false}});
 expect(config.secure).toEqual(expect.arrayContaining(['securityLevel','maxTextSize','maxEdges','htmlLabels','flowchart']));
});
