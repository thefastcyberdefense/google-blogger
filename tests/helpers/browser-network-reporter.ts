import type { Reporter, FullConfig, Suite, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import { loadManifest, stageRoot, writeEvidence, writeIndexedEvidence, entryFor, type Manifest, type TestEntry, type ResultEntry } from '../../tools/finalize-browser-network.ts';
import { ADOPTED_FILES, repositoryFile, reporterOwner } from './browser-network-scope.ts';

const scoped=(test:TestCase)=>ADOPTED_FILES.includes(repositoryFile(test.location.file,process.cwd(),'render'));
function entry(test:TestCase):TestEntry {
  const project=test.parent.project();if(!project)throw new Error('N1_REPORTER_PROJECT');
  const ancestry:{type:string;title:string;file?:string}[]=[];
  for(let suite:Suite|undefined=test.parent;suite;suite=suite.parent)ancestry.unshift({type:suite.type,title:suite.title,file:suite.location?.file});
  const owner=reporterOwner({file:test.location.file,repositoryRoot:process.cwd(),title:test.title,project:project.name,repeatEachIndex:test.repeatEachIndex,ancestry});
  const result=entryFor(owner);if(result.engine!==String(project.use.browserName??'chromium'))throw new Error('N2A_REPORTER_ENGINE');return result;
}
export default class BrowserNetworkReporter implements Reporter {
  private root='';private manifest?:Manifest;private errors=0;private marked=false;
  private results:ResultEntry[]=[];
  private failure() {
    this.errors++;
    if(!this.marked && this.root && this.manifest) {
      this.marked=true;
      try {writeEvidence(this.root,'reporter-error.json',{...this.manifest,kind:'reporter-error',code:'N1_REPORTER'});}catch { /* Missing results also fail the explicit finalizer. */ }
    }
  }
  printsToStdio(){return false;}
  onBegin(_config:FullConfig,suite:Suite) {
    try {
      this.root=stageRoot();this.manifest=loadManifest(this.root);
      const tests=suite.allTests().filter(scoped).map(entry);
      writeIndexedEvidence(this.root,{...this.manifest,kind:'discovery',tests});
    } catch {this.failure();}
  }
  onTestEnd(test:TestCase,result:TestResult) {
    try {
      if(!scoped(test))return;
      this.results.push({...entry(test),status:result.status,expectedStatus:test.expectedStatus,retry:result.retry,worker:result.workerIndex,contexts:test.annotations.filter(a=>a.type==='n1-context').map(a=>a.description??'')});
    } catch {this.failure();}
  }
  onError(){this.failure();}
  async onEnd(result:FullResult) {
    try {
      if(!this.manifest) throw new Error('N1_REPORTER_MANIFEST');
      writeIndexedEvidence(this.root,{...this.manifest,kind:'results',status:result.status,errors:this.errors,tests:this.results});
    } catch {this.failure();}
    if(this.errors) return {status:'failed' as const};
  }
}
