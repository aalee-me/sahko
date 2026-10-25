// A small, locally rendered noise field gives the Clouds an organic, soft atmosphere.
export function createCloudAtmosphere(field){
 const canvas=document.createElement('canvas');canvas.className='clouds-atmosphere';canvas.setAttribute('aria-hidden','true');field.prepend(canvas);let size='';
 const hash=(x,y)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295};
 function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),a=x-ix,b=y-iy,u=a*a*(3-2*a),v=b*b*(3-2*b);return(hash(ix,iy)*(1-u)+hash(ix+1,iy)*u)*(1-v)+(hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u)*v}
 function draw(){const box=field.getBoundingClientRect(),next=Math.round(box.width)+'x'+Math.round(box.height);if(!box.width||!box.height||size===next)return;size=next;const w=240,h=Math.max(120,Math.min(360,Math.round(w*box.height/box.width)));canvas.width=w;canvas.height=h;const c=canvas.getContext('2d'),data=c.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let n=0,amp=.58,scale=1;for(let octave=0;octave<5;octave++){n+=noise(x/w*4.4*scale+13,y/h*4.4*scale+7)*amp;scale*=2;amp*=.5}const density=Math.max(0,Math.min(1,(n-.3)*2.8)),i=(y*w+x)*4,light=142+density*68;data.data[i]=light*.94;data.data[i+1]=light*.98;data.data[i+2]=light+7;data.data[i+3]=Math.pow(density,2.1)*170}c.putImageData(data,0,0)}
 return {draw,move(x,y){canvas.style.transform='translate('+x*.7+'px,'+y*.7+'px) scale(1.12)'}};
}
