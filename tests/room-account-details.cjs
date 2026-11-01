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
  await context.addInitScript(()=>localStorage.setItem('sahko-guest-profile-v1',JSON.stringify({id:'guest-a1b2c3d4-0000-4000-8000-000000000000',name:'Guest',handle:'@guest_a1b2c3d40000',avatar:null,guest:true})));
  const resets=[];await context.route('**/auth/v1/recover*',route=>{resets.push(JSON.parse(route.request().postData()||'{}'));return route.fulfill({contentType:'application/json',body:'{}'})});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://sahko.test',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.sahkoProfile&&window.SahkoAccounts);

  await page.evaluate(()=>{config.reduced=true;config.soundVolume=0;sahkoProfile.open('account')});
  assert.equal(await page.locator('.my-profile-identity h1').innerText(),'OrbiterA1B2C3');
  assert.equal(await page.locator('.my-profile-handle').innerText(),'@OrbiterA1B2C3');
  const primary=page.locator('.account-form .ui-button--primary');assert(await primary.count());
  await page.getByRole('textbox',{name:'Email',exact:true}).fill('reset@example.test');await page.getByRole('button',{name:'Forgot password?',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Check your email for a password reset link.'}).waitFor();assert.equal(resets.length,1);assert.equal(resets[0].email,'reset@example.test');
  for(const width of[390,1200]){await page.setViewportSize({width,height:844});const form=await primary.boundingBox();assert(form.width<width&&form.height>=40);await page.locator('#myProfile').screenshot({path:'/tmp/sahko-account-'+width+'.png'})}
  await page.getByRole('button',{name:'Close profile',exact:true}).click();await page.evaluate(()=>Sahko.open(1));await page.locator('.directory-tabs button').filter({hasText:'Available rooms'}).click();
  for(const width of[390,1200]){await page.setViewportSize({width,height:844});const card=page.locator('.room-listing').first(),row=card.locator('.room-code-tools');await row.hover();await page.waitForTimeout(250);
   const centers=await row.evaluate(e=>[...e.querySelectorAll('output,button')].map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y+r.height/2,right:r.right,opacity:getComputedStyle(n).opacity}}));
   assert(Math.max(...centers.map(r=>r.y))-Math.min(...centers.map(r=>r.y))<1,JSON.stringify(centers));assert(centers[1].x>=centers[0].right);assert(centers[2].x>=centers[1].right);assert.equal(centers[1].opacity,'1');
   assert((await card.locator('.room-block-label').getAttribute('data-tooltip')).includes('one focus interval'));assert((await card.locator('.room-time').getAttribute('data-tooltip')).includes('full session'));
  }
  await page.evaluate(()=>{Sahko.open(0)});await page.locator('#onboardExplore').click();await page.evaluate(()=>sahkoSpaces.openVoid());await page.evaluate(()=>sahkoClouds.lookUp());await page.waitForFunction(()=>document.body.classList.contains('in-clouds'));
  assert.equal(await page.locator('body>header').evaluate(e=>getComputedStyle(e).visibility),'visible');assert.equal(await page.locator('body>header').evaluate(e=>e.inert),false);
  await page.evaluate(()=>{sahkoClouds.returnToVoid();sahkoSpaces.closeVoid();window.savedRoomRequest=roomRequest;syncRoom=async()=>{};window.soloLeaves=[];roomRequest=async(action,body)=>{if(action==='leave'){soloLeaves.push(body);return{ok:true}}return {}};const me=people.find(p=>p.name==='You');liveState.active=true;liveState.memberId=me.id;liveState.isHost=true;liveState.room='fixture-room';solo=false;paused=true;remaining=123;render()});

  const soloTab=page.locator('.space-tabs').getByRole('tab',{name:'Solo',exact:true});await soloTab.click();assert(await page.locator('.solo-leave-dialog').isVisible());assert.equal(await page.evaluate(()=>soloLeaves.length),0);await page.getByRole('button',{name:'Stay in room',exact:true}).click();assert.equal(await page.evaluate(()=>liveState.active),true);
  await soloTab.click();await page.locator('.solo-leave-dialog').getByRole('button',{name:'Leave room',exact:true}).click();await page.waitForFunction(()=>!liveState.active&&solo);assert.equal(await page.evaluate(()=>soloLeaves.length),1);assert.equal(await page.evaluate(()=>remaining),123);assert.equal(await page.evaluate(()=>people.length),1);
  assert.deepEqual(errors,[]);console.log('PASS guest label migration, password reset request and account controls, inline card actions/tooltips, shared Clouds header, Solo confirmation and actual room leave.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
