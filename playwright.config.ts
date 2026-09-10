import { defineConfig } from '@playwright/test';
const themes=['light','dark'] as const;
export default defineConfig({
 testDir:'./tests/render',timeout:45000,fullyParallel:true,forbidOnly:!!process.env.CI,retries:0,workers:4,
 reporter:[['list'],['github'],['json',{outputFile:'test-results/browser.json'}],['html',{open:'never'}]],
 use:{baseURL:'https://blogs.fastcyberdefense.com',trace:'retain-on-failure',screenshot:'only-on-failure',browserName:'chromium'},
 projects:[
  ...[320,360,375,390,430,640,768,1024,1280,1440,1920].flatMap(width=>themes.map(colorScheme=>({name:`${width}-${colorScheme}`,use:{viewport:{width,height:900},colorScheme}}))),
  ...(['firefox','webkit'] as const).flatMap(browserName=>[390,1280].flatMap(width=>themes.map(colorScheme=>({name:`${browserName}-${width}-${colorScheme}`,testMatch:'**/publication-acceptance.spec.ts',use:{browserName,viewport:{width,height:900},colorScheme}}))))
 ]
});
