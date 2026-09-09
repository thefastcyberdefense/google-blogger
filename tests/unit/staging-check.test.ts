import {expect,it} from 'vitest';
import {validateManifest} from '../../tools/staging-check.ts';
it('missing staging URLs block rather than pass',()=>expect(()=>validateManifest({origin:'',build:'',views:[]})).toThrow());
it('requires distinct required native page types',()=>expect(()=>validateManifest({origin:'https://stage.example',build:'0.1.0+'+'a'.repeat(40),views:[{type:'home',url:'https://stage.example/'}]})).toThrow());
