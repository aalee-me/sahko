export async function captureConstellation({messages,nodes,background,showText=false,date=new Date()}){
 const box=background.getBoundingClientRect(),width=Math.max(320,box.width),height=Math.max(320,box.height),scale=Math.min(3,4096/Math.max(width,height+48));
 const canvas=document.createElement('canvas');canvas.width=Math.round(width*scale);canvas.height=Math.round((height+48)*scale);const c=canvas.getContext('2d');c.scale(scale,scale);c.fillStyle='#090a0b';c.fillRect(0,0,width,height+48);
 const glow=c.createRadialGradient(width*.5,height*.5,0,width*.5,height*.5,width*.55);glow.addColorStop(0,'#32243c');glow.addColorStop(1,'#090a0b');c.fillStyle=glow;c.fillRect(0,0,width,height);
 const source=background.querySelector('canvas');if(source?.width)c.drawImage(source,0,0,width,height);
 const points=nodes.map((node,index)=>{const star=node.querySelector('i').getBoundingClientRect();return{x:star.x+star.width/2-box.x,y:star.y+star.height/2-box.y,message:messages[index]}});
 c.strokeStyle='#d1cdd060';c.lineWidth=.6;c.beginPath();points.forEach((p,i)=>{if(i){c.moveTo(points[i-1].x,points[i-1].y);c.lineTo(p.x,p.y)}});c.stroke();
 for(const p of points){c.fillStyle='#ffce58';c.shadowColor='#ffd361';c.shadowBlur=14;c.beginPath();c.arc(p.x,p.y,3,0,Math.PI*2);c.fill();c.shadowBlur=0;if(showText&&p.message){c.font='14px sans-serif';c.textAlign='center';c.fillStyle='#e7e4dc';let line='',lines=[];for(const word of p.message.text.split(/\s+/)){if(c.measureText(line+' '+word).width>180&&line){lines.push(line);line=word}else line+=(line?' ':'')+word}if(line)lines.push(line);lines.slice(0,5).forEach((text,i)=>c.fillText(text,p.x,p.y+24+i*19,200))}}
 c.fillStyle='#aaa69c';c.font='11px sans-serif';c.textAlign='left';c.fillText('Sähkö · The Void · '+date.toLocaleString(),16,height+29);c.textAlign='right';c.fillText(showText?'Text included':'Geometry only · redacted',width-16,height+29);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('The constellation could not be captured.');return {blob,width:canvas.width,height:canvas.height};
}
