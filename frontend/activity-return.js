(() => {
 const {el}=Sahko;const button=el('button','claim-focus-button');button.id='claimFocus';button.type='button';button.hidden=true;button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5-5 5 5 5M3 10h10a7 7 0 0 1 7 7v2"/></svg><span>I’m back</span>';document.body.append(button);let moved=false,busy=false;
 const me=()=>people.find(p=>liveState.active?p.id===liveState.memberId:p.name==='You');const drifting=()=>!!me()?.target&&!onBreak&&!paused&&!window.sahkoCompleted&&!liveState.complete;
 function paint(){if(!drifting())moved=false;button.hidden=!moved||!drifting()||document.getElementById('onboarding').open||document.getElementById('checkin').open||document.getElementById('driftPopup').open||document.body.classList.contains('in-void');button.disabled=busy}
 document.addEventListener('sahko:activity',()=>{if(drifting())moved=true;paint()});button.onclick=async()=>{if(busy)return;busy=true;paint();if(liveState.active)await liveAction('member',{drift:0},'PATCH');else document.getElementById('selfRefocus').click();updateLightCue();busy=false;if(!drifting())moved=false;paint()};setInterval(paint,250);
})();
