/* Loaded only by the GitHub Pages export: no server or shared accounts. */
(() => {
 window.sahkoStaticDemo=true;
 const nativeFetch=window.fetch.bind(window),key='sahko-pages-profile-v1';
 const profile=()=>{try{return JSON.parse(localStorage.getItem(key)||'null')||{id:'local-demo',name:'You',handle:'@you'}}catch{return{id:'local-demo',name:'You',handle:'@you'}}};
 window.fetch=async(input,options={})=>{
  const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href);
  if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return nativeFetch(input,options);
  const path=url.pathname.slice(5),method=(options.method||(input instanceof Request?input.method:'GET')).toUpperCase();let value,status=200;
  if(path==='me'&&method==='GET')value=profile();
  else if(path==='me/avatar'&&method==='POST'){const body=JSON.parse(options.body||'{}'),me=profile();me.avatar=body.image||null;try{localStorage.setItem(key,JSON.stringify(me));value={avatar:me.avatar}}catch{status=507;value={error:'This device has no space to save the photo.'}}}
  else if(path==='rooms'&&method==='GET')value={rooms:[]};
  else if(path==='friends'&&method==='GET')value={friends:[]};
  else if(path==='invites'&&method==='GET')value={invites:[]};
  else if(/^rooms\/[^/]+\/preview$/.test(path)){status=404;value={error:'Invalid code'}}
  else{status=503;value={error:'Shared rooms and calls need a server. This GitHub Pages demo runs on your device.'}}
  return new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
 };
 document.addEventListener('DOMContentLoaded',()=>{const state=document.getElementById('connectionState');if(state){state.textContent='Local demo';state.title='Tasks, thoughts and sessions are stored on this device. Shared rooms require a backend.'}});
})();
