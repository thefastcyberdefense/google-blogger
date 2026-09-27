import type { Reporter, FullConfig, Suite, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import { loadManifest, stageRoot, testKey, writeEvidence, type Manifest, type TestEntry, type ResultEntry } from '../../tools/finalize-browser-network.ts';

const scoped=(test:TestCase)=>test.location.file.replaceAll('\\','/').endsWith('/tests/render/network-isolation.spec.ts');
function entry(test:TestCase):TestEntry {
  const project=test.parent.project();
  if(!project) throw new Error('N1_REPORTER_PROJECT');
  return {key:testKey(project.name,test.title),title:test.title,project:project.name,engine:String(project.use.browserName??'chromium')};
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
      writeEvidence(this.root,'discovery.json',{...this.manifest,kind:'discovery',tests});
    } catch {this.failure();}
  }
  onTestEnd(test:TestCase,result:TestResult) {
    if(!scoped(test)) return;
    try {
      this.results.push({...entry(test),status:result.status,expectedStatus:test.expectedStatus,retry:result.retry,worker:result.workerIndex,contexts:test.annotations.filter(a=>a.type==='n1-context').map(a=>a.description??'')});
    } catch {this.failure();}
  }
  onError(){this.failure();}
  onEnd(result:FullResult) {
    try {
      if(!this.manifest) throw new Error('N1_REPORTER_MANIFEST');
      writeEvidence(this.root,'results.json',{...this.manifest,kind:'results',status:result.status,errors:this.errors,tests:this.results});
    } catch {this.failure();}
    if(this.errors) return {status:'failed' as const};
  }
}
