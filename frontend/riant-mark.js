// Restore the original dotted-circle mark used for the Void.
(() => {
 window.sahkoBrandMetrics={width:28,height:28,counterX:14,counterY:14,counterRadius:9};
 window.sahkoBrandOrigin={x:.5,y:.5};
 window.sahkoBrandAperture=(x,y,radius)=>'circle('+radius+'px at '+x+'px '+y+'px)';
 window.sahkoBrandSVG='<svg class="riant-o-svg" viewBox="0 0 28 28" aria-hidden="true" focusable="false"><circle class="void-mark-fill" cx="14" cy="14" r="9"/><circle class="void-mark-ring" cx="14" cy="14" r="9"/></svg>';
 const mark=document.querySelector('.brand .mark');if(mark)mark.innerHTML=window.sahkoBrandSVG;
 const onboard=document.querySelector('.onboard-wordmark');if(onboard)onboard.innerHTML='<span class="riant-brand-mark">'+window.sahkoBrandSVG+'</span><span>sähkö</span>';
})();
