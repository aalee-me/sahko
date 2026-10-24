(() => {
 // A local heuristic, not a hardware pickup counter. No samples leave this object.
 class PickupDetector {
  constructor(){this.reset()}
  reset(){this.previous=null;this.baseline=null;this.restSince=null;this.motionSince=null;this.armed=false;this.lastPickup=-Infinity}
  feed(sample,now){const vector=[sample.x,sample.y,sample.z];if(!vector.every(Number.isFinite)||!Number.isFinite(now))return false;const mag=Math.hypot(...vector);if(mag<1)return false;const delta=this.previous?Math.hypot(...vector.map((v,i)=>v-this.previous[i])):0;this.previous=vector;const motion=Math.max(Number(sample.linearMagnitude)||0,delta);
   if(motion<.65){if(this.restSince===null)this.restSince=now;if(now-this.restSince>=1800&&!this.armed&&now-this.lastPickup>=10000){this.baseline=vector;this.armed=true;this.motionSince=null}}else this.restSince=null;
   if(!this.armed)return false;if(motion>1.2&&this.motionSince===null)this.motionSince=now;if(this.motionSince===null)return false;if(now-this.motionSince>1600){this.motionSince=null;return false}const baseMag=Math.hypot(...this.baseline),cos=Math.max(-1,Math.min(1,vector.reduce((s,v,i)=>s+v*this.baseline[i],0)/(mag*baseMag))),tilt=Math.acos(cos)*180/Math.PI;if(tilt>=22&&now-this.motionSince>=100&&now-this.lastPickup>=10000){this.lastPickup=now;this.armed=false;this.motionSince=null;this.restSince=null;return true}return false;
  }
 }
 window.SahkoPickupDetector=PickupDetector;
})();
