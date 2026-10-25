// Private device storage is intentionally separate from the public Clouds store.
const key='sahko-private-void-v1';
export function createVoidStorage(report=()=>{}){
 let dbPromise;
 function database(){if(!('indexedDB' in window))return Promise.resolve(null);return dbPromise??=new Promise(resolve=>{const request=indexedDB.open('sahko-private-void',1);request.onupgradeneeded=()=>request.result.createObjectStore('voice',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>{report('Voice notes stay private in this tab; device storage is unavailable.');resolve(null)}})}
 function typed(){try{const rows=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(rows)?rows.filter(m=>!m.voice&&typeof m.text==='string'&&Number.isFinite(m.at)).slice(-100):[]}catch{return[]}}
 return {
  async restore(){const messages=typed(),db=await database();if(db)await new Promise(resolve=>{const request=db.transaction('voice').objectStore('voice').getAll();request.onsuccess=()=>{for(const m of request.result)if(m.voice?.blob instanceof Blob)messages.push({...m,voice:{...m.voice,url:URL.createObjectURL(m.voice.blob)}});resolve()};request.onerror=()=>resolve()});return messages.sort((a,b)=>a.at-b.at).slice(-100)},
  save(messages){const text=messages.filter(m=>!m.voice).map(m=>({id:m.id,text:m.text,at:m.at,position:m.position,cloudCopy:m.cloudCopy,cloudNonce:m.cloudNonce}));try{localStorage.setItem(key,JSON.stringify(text))}catch{report('Device storage is full. New thoughts remain private in this tab.')}
   database().then(db=>{if(!db)return;const transaction=db.transaction('voice','readwrite'),store=transaction.objectStore('voice');store.clear();for(const m of messages)if(m.voice?.blob instanceof Blob)store.put({id:m.id,text:m.text,at:m.at,position:m.position,voice:{blob:m.voice.blob,duration:m.voice.duration,peaks:m.voice.peaks,transcript:m.voice.transcript}});transaction.onerror=()=>report('Voice notes stay private in this tab; device storage is full.')}).catch(()=>report('Device storage is unavailable. Thoughts remain private in this tab.'))}
 };
}
