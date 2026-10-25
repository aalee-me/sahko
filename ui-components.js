/* Small DOM components shared by setup surfaces. Domain logic stays with callers. */
(() => {
  const node=(tag,className,text)=>{const element=document.createElement(tag);element.className=className;if(text!==undefined)element.textContent=text;return element};
  const iconPaths={
    block:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 8v8M15 8v8"/>',
    clock:'<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
    hourglass:'<path d="M5 4h14M5 20h14M7 4v4l5 4-5 4v4M17 4v4l-5 4 5 4v4"/>',
    lock:'<rect x="5" y="10" width="14" height="10" rx="3"/><path d="M8 10V8a4 4 0 0 1 8 0v2M12 14v2"/>',
    people:'<circle cx="9" cy="7" r="3"/><path d="M2 20v-2a7 7 0 0 1 14 0v2M17 4a3 3 0 0 1 0 6M19 15a5 5 0 0 1 3 5"/>',
    expand:'<path d="M9 3H3v6M15 3h6v6M21 15v6h-6M9 21H3v-6M3 3l6 6M21 21l-6-6"/>',
    person:'<circle cx="12" cy="7" r="3"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/>',
    copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
    camera:'<path d="M8 6l1.5-2h5L16 6h4v14H4V6Z"/><circle cx="12" cy="13" r="4"/>',
    nodes:'<rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="15" width="6" height="6" rx="1.5"/><path d="M9 6h7a2 2 0 0 1 2 2v7M6 9v9h9"/>',
    undo:'<path d="m8 4-5 5 5 5M3 9h11a6 6 0 0 1 0 12"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    info:'<circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 8h.01"/>',
    cloudSend:'<path d="M6 18H5a4 4 0 0 1-.6-8A6 6 0 0 1 16 7a5 5 0 0 1 3 9.6M12 21V11m-4 4 4-4 4 4"/>',
    share:'<path d="M12 15V3m-4 4 4-4 4 4M5 12v8h14v-8"/>',
    pause:'<path d="M9 5v14M15 5v14"/>',
    play:'<path d="m9 5 10 7-10 7Z"/>',
    skip:'<path d="m6 5 10 7-10 7ZM18 5v14"/>',
    checklist:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/>',
    menu:'<circle cx="5" cy="6" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="18" r="1"/><path d="M9 6h11M9 12h11M9 18h11"/>',
    home:'<path d="m4 10 8-7 8 7v10h-6v-6h-4v6H4Z"/>',
    leave:'<path d="M9 4H5v16h4M14 8l4 4-4 4M8 12h10"/>',
    desktop:'<rect x="3" y="4" width="18" height="13" rx="3"/><path d="M8 21h8M12 17v4"/>'
  };
  function iconSVG(name){if(!iconPaths[name])throw new Error('Unknown UI icon: '+name);return '<svg class="ui-icon-svg" data-ui-icon="'+name+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+iconPaths[name]+'</svg>'}
  function button({label,variant='secondary',icon,className='',onClick,type='button'}={}){const root=node('button','ui-button'+(variant==='primary'?' ui-button--primary':'')+(className?' '+className:''));root.type=type;root.append(node('span','',label||''));if(icon){const holder=document.createElement('template');holder.innerHTML=icon;root.append(holder.content)}if(onClick)root.onclick=onClick;return root}
  function iconLabel({label,icon,className=''}) {
    const root=node('span','ui-icon-label '+className);
    if(icon)root.innerHTML=icon;
    root.append(node('span','',label));
    return root;
  }
  function roomHeader({title,code,availability,people,expanded=false}) {
    const root=node('div','ui-room-header'+(expanded?' room-detail-heading':''));
    root.append(node(expanded?'h2':'h3','ui-room-title',title));
    for(const slot of [code,availability,people])if(slot)root.append(slot);
    return root;
  }
  function rosterOverflow(summary,total){
    summary.querySelector('.directory-overflow:not(.directory-overflow--two):not(.directory-overflow--one)')?.classList.add('directory-overflow--regular');
    for(const [visible,variant]of [[2,'two'],[1,'one']])if(total>visible&&!summary.querySelector('.directory-overflow--'+variant)){
      const extra=node('span','directory-overflow directory-overflow--'+variant,'+'+(total-visible));
      extra.setAttribute('aria-hidden','true');summary.insertBefore(extra,summary.querySelector('.directory-chevron'));
    }
  }
  function choice({label,name,value,selected=false,onChange}){
    const root=node('label','ui-choice'),input=document.createElement('input');input.type='radio';input.name=name;input.value=value;input.checked=selected;
    input.onchange=()=>{if(input.checked)onChange?.(value)};root.append(input,node('span','',label));return root;
  }
  function positionMarkerHint(marker,hint,container){
    const dot=marker.getBoundingClientRect(),box=container.getBoundingClientRect(),width=hint.getBoundingClientRect().width;
    const center=dot.x+dot.width/2,left=Math.max(8,Math.min(innerWidth-width-8,center-width/2));
    hint.style.left=(left-box.x)+'px';hint.style.top=(dot.bottom-box.y+8)+'px';
    hint.style.setProperty('--marker-arrow-x',(center-left)+'px');
  }
  function rosterMotion(menu,{sources,targets,panel}) {
    menu.classList.add('roster-motion');
    let animations=[],closing=false;
    const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches||(typeof config!=='undefined'&&config.reduced);
    function register(){const items=[...menu.querySelectorAll(sources),...menu.querySelectorAll('.people-overflow,.directory-overflow')].filter(a=>a.getBoundingClientRect().width>0);items.forEach((avatar,index)=>{avatar.dataset.rosterSource='';avatar.style.setProperty('--roster-delay',index*50+'ms')});menu.classList.toggle('roster-reduced',reduced())}register();new MutationObserver(register).observe(menu.querySelector('summary'),{childList:true,subtree:true});
    menu.querySelector('summary').addEventListener('click',event=>{if(!menu.open||reduced())return;event.preventDefault();if(closing)return;const list=menu.querySelector(panel);if(!list){menu.open=false;return}closing=true;const current=getComputedStyle(list),exit=list.animate([{opacity:current.opacity,transform:current.transform},{opacity:0,transform:'translateY(-.25rem)'}],{duration:120,easing:'ease-in',fill:'forwards'});animations.push(exit);exit.finished.then(()=>{closing=false;menu.open=false},()=>{closing=false})});
    menu.addEventListener('toggle',()=>{
      animations.forEach(a=>a.cancel());animations=[];register();
      const to=[...menu.querySelectorAll(targets)];
      if(reduced()||!menu.open)return;
      const list=menu.querySelector(panel);
      if(list)animations.push(list.animate([{opacity:0},{opacity:1}],{duration:160,delay:90,fill:'backwards',easing:'ease-out'}));
      to.forEach((avatar,index)=>animations.push(avatar.animate([{opacity:0,transform:'scale(.94)'},{opacity:1,transform:'scale(1)'}],{duration:180,delay:110+index*45,fill:'backwards',easing:'ease-out'})));

    });
  }
  window.SahkoUI={choice,positionMarkerHint,rosterMotion,button,iconSVG,iconLabel,roomHeader,rosterOverflow};
})();
