const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/Users/saekiisaoichi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
 const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const report=[];
 for(const width of [390,768,1440]) {
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  for(const file of ['index','company','service','contact','privacy']) {
   await page.goto('http://127.0.0.1:8765/'+file+'.html');
   await page.evaluate(async()=>{ await document.fonts.ready; for(const im of document.images) { im.loading='eager'; } await Promise.all(Array.from(document.images,im=>im.decode().catch(()=>{}))); });
   const result=await page.evaluate(()=>({h1:document.querySelectorAll('h1').length,overflow:document.documentElement.scrollWidth>innerWidth,broken:Array.from(document.images).filter(i=>!i.naturalWidth).map(i=>i.src),links:Array.from(document.querySelectorAll('a[href]'),a=>a.getAttribute('href')),ids:Array.from(document.querySelectorAll('[id]'),e=>e.id)}));
   assert.equal(result.h1,1,file); assert.equal(result.overflow,false,file+' overflow '+width); assert.deepEqual(result.broken,[],file+' broken images');
   assert.equal(new Set(result.ids).size,result.ids.length,file+' duplicate ids');
   for(const href of result.links) { if(/^(https?:|tel:|mailto:)/.test(href))continue; const [f,hash]=href.split('#'); const target=path.join(process.cwd(), f || file+'.html'); assert(fs.existsSync(target),'Missing '+href); if(hash) assert(fs.readFileSync(target,'utf8').includes('id="'+hash+'"'),'Missing anchor '+href); }
   if(width!==768) await page.screenshot({path:'output/previews/'+file+'-'+width+'.png',fullPage:true});
   report.push({page:file,width,status:'passed'});
  }
  if(width===390){
   await page.goto('http://127.0.0.1:8765/index.html');
   await page.locator('.menu-btn').click();
   assert.equal(await page.locator('.menu-btn').getAttribute('aria-expanded'),'true');
   assert.equal(await page.locator('main').evaluate(e=>e.inert),true);
   await page.locator('#gnav a').last().focus(); await page.keyboard.press('Tab');
   assert.equal(await page.evaluate(()=>document.activeElement.className),'menu-btn');
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('.menu-btn').getAttribute('aria-expanded'),'false');
   assert.equal(await page.locator('main').evaluate(e=>e.inert),false);
   await page.locator('.menu-btn').click(); await page.setViewportSize({width:1024,height:900});
   assert.equal(await page.locator('.menu-btn').getAttribute('aria-expanded'),'false');
   report.push({test:'Mobile menu: open, focus trap, Escape, breakpoint reset',status:'passed'});
  }
  assert.deepEqual(errors,[]); await page.close();
 }
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:8765/contact.html');
 assert.equal(await page.locator('form').count(),0);
 const mails=await page.locator('a[href^="mailto:"]').evaluateAll(a=>a.map(x=>x.getAttribute('href')));
 assert(mails.length>=4);
 report.push({test:'Contact: no form, mailto links present',status:'passed'});
 const nojs=await browser.newPage({javaScriptEnabled:false}); await nojs.goto('http://127.0.0.1:8765/index.html'); assert(await nojs.locator('#about-title').isVisible());
 report.push({test:'No JavaScript content visible',status:'passed'});
 fs.writeFileSync('output/verification.json',JSON.stringify(report,null,2));
 await browser.close(); console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});
