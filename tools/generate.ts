import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { compile } from 'sass';
import { build as bundle } from 'esbuild';
const require=createRequire(import.meta.url);
export const pug=require('pug') as {renderFile(path:string,options:Record<string,unknown>):string};
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function assets(){
 const css=compile(path.join(root,'src/styles/main.scss'),{style:'compressed'}).css;
 const grammars=['core','markup','clike','javascript','bash','powershell','python','typescript','sql','json','yaml','docker','http'];
 const prism=(await Promise.all(grammars.map(name=>readFile(require.resolve(`prismjs/components/prism-${name}.min.js`),'utf8')))).join('\n');
 const result=await bundle({entryPoints:[path.join(root,'src/scripts/main.ts')],bundle:true,write:false,minify:true,format:'iife',target:'es2022',legalComments:'inline'});
 const script='globalThis.Prism={manual:true,disableWorkerMessageHandler:true};\n'+prism+'\n'+result.outputFiles[0].text;
 if(css.includes(']]>')||script.includes(']]>'))throw new Error('Unsafe CDATA terminator in compiled assets');
 return {css,script};
}
export async function generateTheme(){
 const sha=(process.env.THEME_SHA||execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'})).trim();
 if(!/^[a-f0-9]{40}$/i.test(sha))throw new Error('A full commit SHA is required');
 const compiled=await assets();
 const html=pug.renderFile(path.join(root,'src/theme.pug'),{...compiled,build:`0.1.0+${sha}`,pretty:true,doctype:'html',rootAttributes:{'b:css':'false','b:defaultwidgetversion':'2','b:layoutsVersion':'3','b:responsive':'true','b:templateUrl':'indie.xml','b:templateVersion':'0.0.0','expr:dir':'data:blog.languageDirection','expr:lang':'data:blog.locale',xmlns:'http://www.w3.org/1999/xhtml','xmlns:b':'http://www.google.com/2005/gml/b','xmlns:data':'http://www.google.com/2005/gml/data','xmlns:expr':'http://www.google.com/2005/gml/expr'}});
 const xml=`<?xml version="1.0" encoding="UTF-8"?>\n${html}\n`;const bytes=Buffer.byteLength(xml);
 if(bytes>500000)throw new Error(`Theme exceeds 500000-byte limit: ${bytes}`);
 const measure=(text:string)=>({raw:Buffer.byteLength(text),gzip:gzipSync(text).byteLength});
 const size={source:sha,xml:measure(xml),css:measure(compiled.css),js:measure(compiled.script)};
 if(process.env.FCD_BASELINE_REPORT){
  const base=JSON.parse(await readFile(process.env.FCD_BASELINE_REPORT,'utf8')) as {source:string;css:{raw:number};js:{raw:number}};
  if(base.source!=='18b127d014e5d02a860603b18f10dd6c7ab81169'||!Number.isFinite(base.css.raw)||!Number.isFinite(base.js.raw))throw new Error('Invalid pinned baseline report');
  if(size.css.raw-base.css.raw>2048||size.js.raw-base.js.raw>8192)throw new Error('Discovery CSS/JS growth exceeds approved budgets');
 }
 await writeFile(path.join(root,'build-size.json'),JSON.stringify(size,null,2));
 await mkdir(path.join(root,'dist'),{recursive:true});await writeFile(path.join(root,'dist/theme.xml'),xml);
 console.log(`Built dist/theme.xml: ${bytes} bytes; CSS ${size.css.raw}; bundled JS ${size.js.raw}; source ${sha}`);
 return xml;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await generateTheme();
