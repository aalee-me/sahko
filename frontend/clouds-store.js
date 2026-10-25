import {validateCloudText} from './cloud-policy.js';
const key='sahko-clouds-demo-v1';
export function createCloudStore(onChange=()=>{}){
 let token;try{token=sessionStorage.getItem('sahko-cloud-viewer');if(!token){token=crypto.randomUUID();sessionStorage.setItem('sahko-cloud-viewer',token)}}catch{token=crypto.randomUUID()}
 let mode='local',ready=false,memory=[],pending=false;
 const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('sahko-clouds-demo'):null;
 function read(){try{const data=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(data))memory=data.filter(x=>typeof x?.id==='string'&&typeof x.text==='string'&&x.expiresAt>Date.now()&&Array.isArray(x.reactions)&&!(()=>{try{validateCloudText(x.text);return false}catch{return true}})()).slice(0,100)}catch{}return memory}
 function write(rows){memory=rows;try{localStorage.setItem(key,JSON.stringify(rows))}catch{}channel?.postMessage('changed');onChange()}
 function view(x){return {id:x.id,text:x.text,at:x.at,expiresAt:x.expiresAt,count:new Set(x.reactions).size,held:x.reactions.includes(token),own:x.owner===token}}
 async function request(path,body){const response=await fetch('api/clouds/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json','x-sahko-cloud-client':token},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(5000)});const data=await response.json();if(!response.ok)throw new Error(data.error||'The clouds are unavailable.');return data}
 channel?.addEventListener('message',()=>{if(mode==='local')onChange()});window.addEventListener('storage',e=>{if(e.key===key&&mode==='local')onChange()});
 return {
  get mode(){return mode},
  async list(){if(!ready){ready=true;if(!window.sahkoStaticDemo){try{const data=await request('thoughts');mode='shared';return data.thoughts}catch{mode='local'}}}if(mode==='shared')return (await request('thoughts')).thoughts;return read().map(view)},
  async release(text,nonce){text=validateCloudText(text);if(!ready)await this.list();if(mode==='shared')return (await request('thoughts',{text,nonce})).thought;
   const rows=read(),existing=rows.find(x=>x.owner===token&&x.nonce===nonce);if(existing)return view(existing);
   if(rows.filter(x=>x.owner===token&&x.at>Date.now()-60000).length>=5)throw new Error('Let these thoughts settle before releasing another copy.');
   const thought={id:crypto.randomUUID(),nonce,text,owner:token,at:Date.now(),expiresAt:Date.now()+86400000,reactions:[]};write([thought,...rows].slice(0,100));return view(thought)},
  async react(id,active){if(mode==='shared'){const result=await request('thoughts/'+encodeURIComponent(id)+'/resonance',{active});onChange();return result.thought}const rows=read(),thought=rows.find(x=>x.id===id);if(!thought)throw new Error('This thought has faded.');if(thought.owner===token)throw new Error('Hold space for another person’s thought.');thought.reactions=thought.reactions.filter(x=>x!==token);if(active)thought.reactions.push(token);write(rows);return view(thought)},
  close(){channel?.close()}
 };
}
