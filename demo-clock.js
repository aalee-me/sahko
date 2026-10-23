/* A display/planning clock; elapsed timers always use the real clock. */
(() => {
 let enabled=false,offset=0;try{const saved=JSON.parse(localStorage.getItem('sahko-demo-clock-v1')||'null');enabled=!!saved?.enabled;offset=Number(saved?.offset)||0}catch{}
 function save(){try{localStorage.setItem('sahko-demo-clock-v1',JSON.stringify({enabled,offset}))}catch{}document.dispatchEvent(new Event('sahko:clock'))}
 window.sahkoNow=()=>Date.now()+(enabled?offset:0);window.sahkoDisplayDate=at=>new Date(Number(at)+(enabled?offset:0));
 window.sahkoClock={get enabled(){return enabled},get offset(){return enabled?offset:0},toggle(value){enabled=!!value;if(enabled&&!offset)this.setTime('03:00');else save()},setTime(value){if(!/^\d{2}:\d{2}$/.test(value))return false;const [h,m]=value.split(':').map(Number);if(h>23||m>59)return false;const now=Date.now(),target=new Date(now);target.setHours(h,m,0,0);offset=+target-now;enabled=true;save();return true}};
})();
