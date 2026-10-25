/* Device-local plan persistence. Never sends task text to a server. */
(() => {
 const key='sahko-plan-v1';
 const parse=raw=>{try{const value=JSON.parse(raw);return value&&Array.isArray(value.tasks)?value:null}catch{return null}};
 const read=name=>{try{return parse(window[name].getItem(key))}catch{return null}};
 const newest=(a,b)=>!a?b:!b?a:(Number(b.savedAt)||0)>(Number(a.savedAt)||0)?b:a;
 let current=newest(read('localStorage'),read('sessionStorage')),clock=Number(current?.savedAt)||0,db;
 const opened=new Promise(resolve=>{
  try{const request=indexedDB.open('sahko-plans',1);request.onupgradeneeded=()=>request.result.createObjectStore('plans');request.onsuccess=()=>{db=request.result;db.onversionchange=()=>db.close();resolve(db)};request.onerror=()=>resolve(null);request.onblocked=()=>resolve(null)}catch{resolve(null)}
 });
 const ready=opened.then(database=>new Promise(resolve=>{
  if(!database)return resolve(current);
  try{const request=database.transaction('plans').objectStore('plans').get(key);request.onsuccess=()=>{current=newest(current,request.result);clock=Math.max(clock,Number(current?.savedAt)||0);resolve(current)};request.onerror=()=>resolve(current)}catch{resolve(current)}
 }));
 function status(durable,temporary){document.dispatchEvent(new CustomEvent('sahko:save-status',{detail:{durable,temporary}}))}
 async function save(plan){
  await ready;
  const snapshot=JSON.parse(JSON.stringify({...plan,savedAt:clock=Math.max(Date.now(),clock+1)}));current=snapshot;
  const raw=JSON.stringify(snapshot);let durable=false,temporary=false;
  try{localStorage.setItem(key,raw);durable=true}catch{}
  try{sessionStorage.setItem(key,raw);temporary=true}catch{}
  if(db)try{await new Promise((resolve,reject)=>{const transaction=db.transaction('plans','readwrite');transaction.objectStore('plans').put(snapshot,key);transaction.oncomplete=resolve;transaction.onerror=transaction.onabort=()=>reject(transaction.error)});durable=true}catch{}
  status(durable,temporary);return durable;
 }
 window.SahkoPlanStorage={read:()=>current,ready,save};
})();
