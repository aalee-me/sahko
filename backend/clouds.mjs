import {validateCloudText} from '../frontend/cloud-policy.js';
const cloudJSON=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
export async function cloudsAPI(request,env){
 const error=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
 try{
  if(env.CLOUDS_ENABLED!==true&&env.CLOUDS_ENABLED!=='true')return cloudJSON({error:'Into the Clouds is not enabled on this server.',code:'CLOUDS_DISABLED'},503);
  if(!env.DB)return cloudJSON({error:'Cloud storage is unavailable.'},503);
  const url=new URL(request.url),db=env.DB,now=Date.now(),token=request.headers.get('x-sahko-cloud-client')||'';
  if(request.headers.get('origin')&&request.headers.get('origin')!==url.origin)error('Origin not allowed',403);
  if(token&&!/^[a-zA-Z0-9-]{20,80}$/.test(token))error('Invalid anonymous session',401);
  if(request.method!=='GET'&&!token)error('An anonymous session is required',401);
  const actor=token?Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode((env.CLOUDS_HASH_SECRET||'local-clouds')+'|'+token))),b=>b.toString(16).padStart(2,'0')).join(''):'';
  async function read(){const raw=await request.text();if(raw.length>2048)error('Request too large',413);let value;try{value=JSON.parse(raw)}catch{error('Invalid JSON')}if(!value||typeof value!=='object'||Array.isArray(value))error('Invalid request');return value}
  async function row(id){return db.prepare('SELECT t.id,t.text,t.created_at,t.expires_at,t.owner_hash,(SELECT COUNT(*) FROM cloud_resonance r WHERE r.thought_id=t.id) AS count,EXISTS(SELECT 1 FROM cloud_resonance r WHERE r.thought_id=t.id AND r.actor_hash=?) AS held FROM cloud_thoughts t WHERE t.id=? AND t.expires_at>?').bind(actor,id,now).first()}
  const publicView=t=>({id:t.id,text:t.text,at:t.created_at,expiresAt:t.expires_at,count:Number(t.count),held:!!t.held,own:t.owner_hash===actor});
  if(url.pathname==='/api/clouds/thoughts'&&request.method==='GET'){
   const records=await db.prepare('SELECT t.id,t.text,t.created_at,t.expires_at,t.owner_hash,(SELECT COUNT(*) FROM cloud_resonance r WHERE r.thought_id=t.id) AS count,EXISTS(SELECT 1 FROM cloud_resonance r WHERE r.thought_id=t.id AND r.actor_hash=?) AS held FROM cloud_thoughts t WHERE t.expires_at>? ORDER BY t.created_at DESC,t.id LIMIT 100').bind(actor,now).all();
   return cloudJSON({thoughts:records.results.map(publicView),mode:'shared',maxCharacters:160});
  }
  if(url.pathname==='/api/clouds/thoughts'&&request.method==='POST'){
   const input=await read();if(Object.keys(input).some(k=>!['text','nonce'].includes(k)))error('Only typed text copies can enter the clouds.');
   let text;try{text=validateCloudText(input.text)}catch(e){error(e.message)}const nonce=input.nonce;if(typeof nonce!=='string'||!/^[a-zA-Z0-9-]{20,80}$/.test(nonce))error('Missing release identifier');
   const existing=await db.prepare('SELECT id FROM cloud_thoughts WHERE owner_hash=? AND nonce=?').bind(actor,nonce).first();if(existing){const current=await row(existing.id);if(!current)error('This copy has faded. Release a new copy.',410);return cloudJSON({thought:publicView(current)})}
   const minute=await db.prepare('SELECT COUNT(*) AS n FROM cloud_thoughts WHERE owner_hash=? AND created_at>?').bind(actor,now-60000).first(),hour=await db.prepare('SELECT COUNT(*) AS n FROM cloud_thoughts WHERE owner_hash=? AND created_at>?').bind(actor,now-3600000).first();if(minute.n>=5||hour.n>=20)error('Let these thoughts settle before releasing another copy.',429);
   await db.prepare('DELETE FROM cloud_resonance WHERE thought_id IN (SELECT id FROM cloud_thoughts WHERE expires_at<=?)').bind(now).run();await db.prepare('DELETE FROM cloud_thoughts WHERE expires_at<=?').bind(now).run();
   const id=crypto.randomUUID();await db.prepare('INSERT INTO cloud_thoughts(id,owner_hash,nonce,text,created_at,expires_at) VALUES(?,?,?,?,?,?) ON CONFLICT(owner_hash,nonce) DO NOTHING').bind(id,actor,nonce,text,now,now+86400000).run();const saved=await db.prepare('SELECT id FROM cloud_thoughts WHERE owner_hash=? AND nonce=?').bind(actor,nonce).first();return cloudJSON({thought:publicView(await row(saved.id))},201);
  }
  const match=url.pathname.match(/^\/api\/clouds\/thoughts\/([a-zA-Z0-9-]{20,80})\/resonance$/);
  if(match&&request.method==='POST'){
   const input=await read();if(Object.keys(input).some(k=>k!=='active')||typeof input.active!=='boolean')error('Choose a silent reaction; replies are not supported.');
   const thought=await row(match[1]);if(!thought)error('This thought has faded.',404);if(thought.owner_hash===actor)error('Hold space for another person’s thought.',403);
   const recent=await db.prepare('SELECT COUNT(*) AS n FROM cloud_resonance WHERE actor_hash=? AND created_at>?').bind(actor,now-60000).first();if(input.active&&recent.n>=30&&!thought.held)error('Let the clouds settle for a moment.',429);
   if(input.active)await db.prepare('INSERT OR IGNORE INTO cloud_resonance(thought_id,actor_hash,created_at) VALUES(?,?,?)').bind(thought.id,actor,now).run();else await db.prepare('DELETE FROM cloud_resonance WHERE thought_id=? AND actor_hash=?').bind(thought.id,actor).run();
   return cloudJSON({thought:publicView(await row(thought.id))});
  }
  return cloudJSON({error:'Not found'},404);
 }catch(e){return cloudJSON({error:e.status?e.message:'Cloud storage is unavailable.'},e.status||503)}
}
