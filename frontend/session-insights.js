/* Derive insights from observed timeline states, never planned interval settings. */
(() => {
 const states=new Set(['focus','idle','break','paused','complete','ended']);
 function summarize(records,now=Date.now()){
  const blocks=[],beforeIdle=[];let focused=0,idle=0,measuredSessions=0,phonePickups=0,phoneSessions=0;
  for(const record of records||[]){
   if(record.phonePickupTracking==='motion'){phoneSessions++;phonePickups+=Math.max(0,Number(record.phonePickups)||0)}
   const start=Number(record.startedAt),end=Math.min(now,Number(record.status==='running'?record.lastSeen:record.endedAt??record.lastSeen));
   if(!Number.isFinite(start)||!Number.isFinite(end)||end<start||record.timelineTruncated||!Array.isArray(record.events))continue;
   const events=record.events.filter(e=>states.has(e.kind)&&Number.isFinite(e.at)&&e.at>=start&&e.at<=end).sort((a,b)=>a.at-b.at);
   if(!events.length)continue;
   const perBlock=new Map();let previous=null,run=0,coverage=0;
   function block(number){const n=Math.max(1,Math.floor(Number(number)||1));if(!perBlock.has(n))perBlock.set(n,{number:n,focused:0,idle:0,seconds:0,completed:false});return perBlock.get(n)}
   function interval(until){if(!previous)return;const seconds=Math.max(0,(until-previous.at)/1000);if(previous.kind==='focus'||previous.kind==='idle'){const b=block(previous.block);b.seconds+=seconds;coverage+=seconds;if(previous.kind==='focus'){b.focused+=seconds;focused+=seconds;run+=seconds}else{b.idle+=seconds;idle+=seconds}}}
   for(const event of events){
    interval(event.at);
    if(previous){
     if(previous.kind==='focus'&&event.kind==='idle'&&(event.block??previous.block)===(previous.block??1))beforeIdle.push(run);
     const phaseAdvanced=(event.kind==='break'||event.kind==='complete')&&(previous.kind==='focus'||previous.kind==='idle'||previous.kind==='paused');
     const blockAdvanced=Number(event.block)>Number(previous.block||1);
     if(phaseAdvanced||blockAdvanced)block(previous.block).completed=true;
     if(event.kind!=='focus'||previous.kind!=='focus'||blockAdvanced)run=0;
    }
    previous={...event,block:Number(event.block)||previous?.block||1};
   }
   interval(end);
   if(coverage>0)measuredSessions++;
   for(const b of perBlock.values())if(b.completed&&b.seconds>0)blocks.push(b);
  }
  const mean=list=>list.length?list.reduce((sum,value)=>sum+value,0)/list.length:null;
  return {measuredSessions,completedBlocks:blocks.length,averageFocusBlockSeconds:mean(blocks.map(b=>b.focused)),averageBlockTimerSeconds:mean(blocks.map(b=>b.seconds)),idleTransitions:beforeIdle.length,averageFocusBeforeIdleSeconds:mean(beforeIdle),focusedSeconds:focused,idleSeconds:idle,focusShare:focused+idle>0?focused/(focused+idle):null,phonePickups:phoneSessions?phonePickups:null,phoneSessions};
 }
 window.SahkoInsights={summarize};
})();
