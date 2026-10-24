(() => {
 const rotations={right:0,left:180,up:-90,down:90,'up-right':-45,'down-left':135};
 window.sahkoArrowSvg=(direction='right')=>'<svg class="ui-arrow-svg" viewBox="0 0 24 24" aria-hidden="true" style="rotate:'+(rotations[direction]??0)+'deg"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>';
 window.sahkoArrow=(direction='right',className='')=>{const span=document.createElement('span');span.className='ui-arrow'+(className?' '+className:'');span.setAttribute('aria-hidden','true');span.innerHTML=window.sahkoArrowSvg(direction);return span};
})();
