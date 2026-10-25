import {validateCloudText} from './cloud-policy.js';
const key='sahko-clouds-demo-v1';
export function createCloudStore(onChange=()=>{}){
 let token;try{token=sessionStorage.getItem('sahko-cloud-viewer');if(!token){token=crypto.randomUUID();sessionStorage.setItem('sahko-cloud-viewer',token)}}catch{token=crypto.randomUUID()}
 let mode='local',ready=false,memory=[],policyMemory={lastAt:0,sent:[]},releaseQueue=Promise.resolve();
 const policyKey='sahko-cloud-send-policy-v1';
 const fingerprint=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text.normalize('NFKC').trim()))),n=>n.toString(16).padStart(2,'0')).join('');
 function policy(){try{const saved=JSON.parse(localStorage.getItem(policyKey)||'null');if(saved&&Number.isFinite(saved.lastAt)&&Array.isArray(saved.sent))policyMemory=saved}catch{}return policyMemory}
 async function releaseStatus(text){const hash=await fingerprint(text),saved=policy(),retryAt=saved.lastAt+60000;if(saved.sent.includes(hash))return{allowed:false,message:'Already sent',hash};if(retryAt>Date.now())return{allowed:false,message:'Wait '+Math.ceil((retryAt-Date.now())/1000)+'s before sending another thought.',retryAt,hash};return{allowed:true,message:'',hash}}
 function recordRelease(hash){const saved=policy();policyMemory={lastAt:Date.now(),sent:[...new Set([...saved.sent,hash])]};try{localStorage.setItem(policyKey,JSON.stringify(policyMemory))}catch{}}
 function serialize(action){if(navigator.locks?.request)return navigator.locks.request('sahko-cloud-release',action);const next=releaseQueue.then(action,action);releaseQueue=next.catch(()=>{});return next}
 const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('sahko-clouds-demo'):null;
 function read(){try{const data=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(data))memory=data.filter(x=>typeof x?.id==='string'&&typeof x.text==='string'&&x.expiresAt>Date.now()&&Array.isArray(x.reactions)&&!(()=>{try{validateCloudText(x.text);return false}catch{return true}})()).slice(0,100).map(({owner,...thought})=>thought);localStorage.setItem(key,JSON.stringify(memory))}catch{}return memory}
 function write(rows){memory=rows;try{localStorage.setItem(key,JSON.stringify(rows))}catch{}channel?.postMessage('changed');onChange()}
 function view(x){return {id:x.id,text:x.text,at:x.at,expiresAt:x.expiresAt,count:new Set(x.reactions).size,held:x.reactions.includes(token)}}
 async function request(path,body){const response=await fetch('api/clouds/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json','x-sahko-cloud-client':token},...(body?{body:JSON.stringify(body)}:{}),credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(5000)});const data=await response.json();if(!response.ok)throw new Error(data.error||'The clouds are unavailable.');return data}
 channel?.addEventListener('message',()=>{if(mode==='local')onChange()});window.addEventListener('storage',e=>{if(e.key===key&&mode==='local')onChange()});
 return {
  get mode(){return mode},
  async list(){if(!ready){ready=true;if(!window.sahkoStaticDemo){try{const data=await request('thoughts');mode='shared';return data.thoughts}catch{mode='local'}}}if(mode==='shared')return (await request('thoughts')).thoughts;return read().map(view)},
  releaseStatus,
  async release(text,nonce){text=validateCloudText(text);return serialize(async()=>{const check=await releaseStatus(text);if(!check.allowed)throw new Error(check.message);if(!ready)await this.list();let result;if(mode==='shared')result=(await request('thoughts',{text,nonce})).thought;else{const rows=read(),existing=rows.find(x=>x.nonce===nonce);if(existing)return view(existing);const thought={id:crypto.randomUUID(),nonce,text,at:Date.now(),expiresAt:Date.now()+86400000,reactions:[]};write([thought,...rows].slice(0,100));result=view(thought)}recordRelease(check.hash);return result})},
  async react(id,active){if(mode==='shared'){const result=await request('thoughts/'+encodeURIComponent(id)+'/resonance',{active});onChange();return result.thought}const rows=read(),thought=rows.find(x=>x.id===id);if(!thought)throw new Error('This thought has faded.');thought.reactions=thought.reactions.filter(x=>x!==token);if(active)thought.reactions.push(token);write(rows);return view(thought)},
  close(){channel?.close()}
 };
}
