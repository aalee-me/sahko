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
  assert.equal(await page.locator('.preview-demo-label').count(),0);
  assert(!(await page.locator('#onboardExplore').innerText()).toLowerCase().includes('demo'));
  for(const width of [1200,585,390]){
   await page.setViewportSize({width,height:900});await page.evaluate(()=>{config.reduced=true;sahkoProfile.open()});
   const tabs=page.locator('.my-profile-tabs');
   await page.waitForFunction(()=>document.querySelector('.my-profile-tabs').classList.contains('unified-switcher'));
   assert.deepEqual(await tabs.locator('button').allTextContents(),['Account','Sessions','Friends']);
   assert.equal(await tabs.locator('.selected').innerText(),'Account');
   const metrics=await page.evaluate(()=>{
    const d=document.querySelector('#myProfile'),s=d.querySelector('.profile-shell'),a=d.querySelector('.my-profile-avatar').getBoundingClientRect(),x=d.querySelector('.profile-return').getBoundingClientRect(),h=d.querySelector('.my-profile-header').getBoundingClientRect(),b=document.querySelector('.onboard-header .my-profile-trigger').getBoundingClientRect(),o=document.querySelector('.onboard-header .profile-initial').getBoundingClientRect();
    return{padding:parseFloat(getComputedStyle(s).paddingLeft),avatar:[a.width,a.height],center:[Math.abs(b.x+b.width/2-o.x-o.width/2),Math.abs(b.y+b.height/2-o.y-o.height/2)],trigger:[b.width,b.height],right:Math.abs(x.right-h.right),overflow:d.scrollWidth>d.clientWidth,closePath:d.querySelector('.profile-return path').getAttribute('d')};
   });
   assert(metrics.padding>=16,JSON.stringify(metrics));assert.equal(metrics.avatar[0],metrics.avatar[1]);assert.equal(metrics.trigger[0],metrics.trigger[1]);assert(metrics.center.every(n=>n<1),JSON.stringify(metrics));assert(metrics.right<1);assert.equal(metrics.overflow,false);assert.equal(metrics.closePath,'m6 6 12 12M18 6 6 18');
   await tabs.getByRole('tab',{name:'Sessions',exact:true}).click();
   assert.equal(await page.locator('.session-calendar-day').count(),new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate());
   assert.equal(await page.locator('.profile-insight-stat').count(),6);
   const style=await page.locator('.session-calendar-days').evaluate(e=>getComputedStyle(e).gridTemplateColumns);assert.equal(style.split(' ').length,7,style);
   assert.equal(await page.locator('.trend-line').first().evaluate(e=>getComputedStyle(e).fill),'none');
   assert(await page.locator('.session-agenda-entry').count()>0);
   await page.locator('.my-profile').screenshot({path:'/tmp/sahko-profile-'+width+'.png'});
   await tabs.getByRole('tab',{name:'Friends',exact:true}).click();assert.equal(await page.locator('.profile-invitations-section').count(),1);
   await page.getByRole('button',{name:'Close profile',exact:true}).click();assert.equal(await page.locator('#myProfile').evaluate(e=>e.open),false);
  }
  await page.evaluate(()=>Sahko.open(1));await page.locator('#onboardPanel .directory-tabs button').filter({hasText:'Available rooms'}).click();await page.waitForFunction(()=>document.querySelectorAll('[data-demo=true]').length===2);
  assert.equal(await page.locator('.room-demo-label').count(),2);assert.equal(await page.locator('.room-demo-badge,.preview-demo-label').count(),0);
  for(const title of await page.locator('[data-demo=true] .ui-room-title').allTextContents())assert(title.endsWith(' [DEMO]'));
  assert.deepEqual(errors,[]);console.log('PASS: restored CSS/calendar, measured insights in Sessions, three animated tabs default Account, centered circles/padding/close X across 3 viewports, invitations in Friends, title-only demo labels.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
