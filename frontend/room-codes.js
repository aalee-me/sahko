(() => {
 const key='sahko-demo-codes-v1',alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let codes={};try{codes=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
 window.sahkoRandomRoomCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>alphabet[n%alphabet.length]).join('');
 window.sahkoDemoCode=kind=>{if(!/^[A-HJ-NP-Z2-9]{6}$/.test(codes[kind]||'')){let code;do{code=window.sahkoRandomRoomCode()}while(Object.values(codes).includes(code));codes[kind]=code;try{localStorage.setItem(key,JSON.stringify(codes))}catch{}}return codes[kind]};
})();
