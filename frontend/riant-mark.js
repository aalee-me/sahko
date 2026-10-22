// Exact lowercase o outline from the user-uploaded RiantDisplay-Bold-TRIAL.otf.
// Keep the original Bezier curves and counter; no substitute font is used.
(() => {
 window.sahkoBrandSVG="<svg class=\"riant-o-svg\" viewBox=\"0 0 570 555\" aria-hidden=\"true\" focusable=\"false\"><g transform=\"translate(0 535) scale(1 -1)\"><path class=\"riant-o-shape\" d=\"M285 525C133 525 13 408 13 258C13 109 133 -10 285 -10C437 -10 557 108 557 258C557 408 438 525 285 525ZM285 97C196 97 129 166 129 258C129 350 196 419 285 419C374 419 441 350 441 258C441 166 374 97 285 97Z\"/><path class=\"void-mark-fill\" d=\"M285 97C196 97 129 166 129 258C129 350 196 419 285 419C374 419 441 350 441 258C441 166 374 97 285 97Z\"/></g></svg>";
 const mark=document.querySelector('.brand .mark');if(mark)mark.innerHTML=window.sahkoBrandSVG;
 const onboard=document.querySelector('.onboard-wordmark');if(onboard)onboard.innerHTML='<span class="riant-brand-mark">'+window.sahkoBrandSVG+'</span><span>sähkö</span>';
})();
