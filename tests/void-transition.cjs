const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext(),errors=[];
  await context.addInitScript(()=>{
   const now=Date.now();
   localStorage.setItem('sahko-session-history-v1',JSON.stringify([1,2].map(n=>({id:'saved-'+n,mode:'solo',status:'complete',startedAt:now-n*3600000,lastSeen:now-n*3600000+120000,endedAt:now-n*3600000+120000,tasks:[{text:'Saved task',done:true}],completedTasks:1,events:[{kind:'focus',at:now-n*3600000,block:1},{kind:'idle',at:now-n*3600000+60000,block:1},{kind:'break',at:now-n*3600000+120000,block:1}]}))));
  });
  await context.route('https://sahko.test/**',route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/orbital-engine.html')return route.fulfill({contentType:'text/html',body:'<script>orbital={ready:true,active(){},set(){},points(){return[]},contourPoint(){return{x:.5,y:.5}},progressArcPoint(){return{x:.5,y:.5}}}</script>'});
   try{const file=path.join(__dirname,'../pages',url.pathname==='/'?'index.html':url.pathname);return route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.css')?'text/css':/\.(m?js)$/.test(file)?'application/javascript':file.endsWith('.svg')?'image/svg+xml':'text/html'})}catch{return route.fulfill({status:404,body:'Not found'})}
  });
  await context.route(/^(?!https:\/\/sahko\.test).*$/,r=>r.abort());
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://sahko.test',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.sahkoProfile&&window.SahkoAccounts);

  await page.locator('#onboardExplore').click();
  await page.evaluate(()=>{config.reduced=false;config.voidDuration=.35;config.soundVolume=0;paused=true});
  for(const theme of ['light','dark'])for(const [width,height,compact]of [[2092,840,false],[1046,420,false],[585,764,true],[390,844,false]]){
   await page.setViewportSize({width,height});await page.evaluate(({theme,compact})=>{sahkoTheme.set(theme);document.body.classList.toggle('compact',compact)}, {theme,compact});await page.waitForTimeout(150);
   await page.evaluate(()=>{const layout=document.querySelector('.layout'),orbital=document.getElementById('originalOrbital');if(getComputedStyle(layout).overflowY==='auto')layout.scrollTop+=orbital.getBoundingClientRect().top-layout.getBoundingClientRect().top});await page.waitForTimeout(50);
   const fade=await page.locator('#originalOrbital').evaluate(e=>({mask:getComputedStyle(e).maskImage,start:parseFloat(e.style.getPropertyValue('--orbital-fade-start')),end:parseFloat(e.style.getPropertyValue('--orbital-fade-end')),height:e.getBoundingClientRect().height}));
   assert(fade.mask.includes('linear-gradient'),JSON.stringify(fade));assert(fade.end>fade.start&&fade.end<=fade.height+1,JSON.stringify({theme,width,height,compact,fade}));
   for(let n=0;n<2;n++){
    const samples=await page.evaluate(async()=>{
     const form=document.getElementById('voidForm'),nav=document.querySelector('#sessionBottomDock .space-tabs'),parent=form.parentElement,measure=()=>{const r=form.getBoundingClientRect(),v=nav.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,navY:v.y}};
     const before=measure(),points=[];sahkoSpaces.openVoid();const start=performance.now();await new Promise(resolve=>{function sample(){points.push(measure());if(performance.now()-start<450)requestAnimationFrame(sample);else resolve()}requestAnimationFrame(sample)});
     const sameParent=form.parentElement===parent;sahkoSpaces.closeVoid();await new Promise(r=>setTimeout(r,450));points.push(measure());
     return{before,points,sameParent};
    });
    assert(samples.sameParent,'Composer was reparented');
    const delta=Math.max(...samples.points.flatMap(p=>['x','y','width','height','navY'].map(k=>Math.abs(p[k]-samples.before[k]))));
    assert(delta<=1.1,JSON.stringify({theme,width,height,compact,delta,...samples}));
   }
  }
  // An interrupted portal must keep the composer in its shared, stationary slot too.
  await page.evaluate(()=>{sahkoSpaces.openVoid();sahkoSpaces.closeVoid();sahkoSpaces.openVoid()});await page.waitForTimeout(450);
  assert.equal(await page.locator('#voidForm').evaluate(e=>e.parentElement.id),'voidComposer');
  assert.equal(await page.locator('#voidComposer').evaluate(e=>e.parentElement.className),'void-dock');
  assert.deepEqual(errors,[]);console.log('PASS bottom-only orbital fade and stationary composer/nav throughout repeated and interrupted Void portals, 4 viewport modes, both themes.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
