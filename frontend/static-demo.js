/* Loaded only by the GitHub Pages export: no server or shared accounts. */
(() => {
 window.sahkoStaticDemo=true;
 const nativeFetch=window.fetch.bind(window),key='sahko-pages-profile-v1';
 const profile=()=>{try{return JSON.parse(localStorage.getItem(key)||'null')||{id:'local-demo',name:'You',handle:'@you'}}catch{return{id:'local-demo',name:'You',handle:'@you'}}};
 const demoRooms=new Map();try{for(const room of JSON.parse(localStorage.getItem('sahko-demo-rooms-v1')||'[]'))if(room?.code)demoRooms.set(room.code.toLowerCase(),room)}catch{}
 window.sahkoRegisterDemoRoom=room=>{if(!room?.code)return;demoRooms.set(room.code.toLowerCase(),{...room,demo:true});try{localStorage.setItem('sahko-demo-rooms-v1',JSON.stringify([...demoRooms.values()].slice(-10)))}catch{}};
 function previewRoom(code){if(demoRooms.has(code))return demoRooms.get(code);const members=code==='late25'?[{id:'m',name:'Maya',photo:47,relationship:'friend'},{id:'e',name:'Eli',photo:13,relationship:'friend'},{id:'s',name:'Sofia',photo:44,relationship:'friend'},{id:'eecho',name:'Eecho',initial:'E',relationship:'friend'}]:code==='studio'?[{id:'guest-a',name:'Orbiter 7D2',anonymous:true,relationship:'none'},{id:'guest-b',name:'Orbiter B41',anonymous:true,relationship:'none'},{id:'guest-c',name:'Orbiter 3F8',anonymous:true,relationship:'none'}]:null;return members?{id:code,code:code.toUpperCase(),demo:true,title:code==='late25'?'The late shift':'Open studio',members,phase:'focus',endsAt:Date.now()+720000,focusSeconds:1500,breakSeconds:300,totalSprints:5,sprint:1}:null}
 window.fetch=async(input,options={})=>{
  const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href);
  if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return nativeFetch(input,options);
  const path=url.pathname.slice(5),method=(options.method||(input instanceof Request?input.method:'GET')).toUpperCase();let value,status=200;
  if(path==='me'&&method==='GET')value=profile();
  else if(path==='me/avatar'&&method==='POST'){const body=JSON.parse(options.body||'{}'),me=profile();me.avatar=body.image||null;try{localStorage.setItem(key,JSON.stringify(me));value={avatar:me.avatar}}catch{status=507;value={error:'This device has no space to save the photo.'}}}
  else if(path==='rooms'&&method==='GET')value={rooms:[]};
  else if(path==='friends'&&method==='GET')value={friends:[{id:'maya',name:'Maya',handle:'@maya',relationship:'friend',online:true,avatar:'https://i.pravatar.cc/100?img=47'},{id:'eli',name:'Eli',handle:'@eli',relationship:'friend',online:true,avatar:'https://i.pravatar.cc/100?img=13'},{id:'sofia',name:'Sofia',handle:'@sofia',relationship:'friend',online:false,avatar:'https://i.pravatar.cc/100?img=44'},{id:'eecho',name:'Eecho',handle:'@eecho',relationship:'friend',online:false}]};
  else if(path==='invites'&&method==='GET')value={invites:[]};
  else if(/^rooms\/[^/]+\/preview$/.test(path)){value=previewRoom(decodeURIComponent(path.split('/')[1]).toLowerCase());if(!value){status=404;value={error:'Invalid code'}}}
  else{status=503;value={error:'Shared rooms and calls need a server. This GitHub Pages demo runs on your device.'}}
  return new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
 };
 document.addEventListener('DOMContentLoaded',()=>{const state=document.getElementById('connectionState');if(state){state.textContent='Local demo';state.title='Tasks, thoughts and sessions are stored on this device. Shared rooms require a backend.'}});
})();
