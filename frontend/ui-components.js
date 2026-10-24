/* Small DOM components shared by setup surfaces. Domain logic stays with callers. */
(() => {
  const node=(tag,className,text)=>{const element=document.createElement(tag);element.className=className;if(text!==undefined)element.textContent=text;return element};
  const iconPaths={
    block:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 8v8M15 8v8"/>',
    clock:'<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
    hourglass:'<path d="M5 4h14M5 20h14M7 4v4l5 4-5 4v4M17 4v4l-5 4 5 4v4"/>',
    lock:'<rect x="5" y="10" width="14" height="10" rx="3"/><path d="M8 10V8a4 4 0 0 1 8 0v2M12 14v2"/>',
    person:'<circle cx="12" cy="7" r="3"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/>',
    copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
    share:'<path d="M12 15V3m-4 4 4-4 4 4M5 12v8h14v-8"/>',
    pause:'<path d="M9 5v14M15 5v14"/>',
    play:'<path d="m9 5 10 7-10 7Z"/>',
    skip:'<path d="m6 5 10 7-10 7ZM18 5v14"/>',
    checklist:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/>',
    menu:'<circle cx="5" cy="6" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="18" r="1"/><path d="M9 6h11M9 12h11M9 18h11"/>',
    desktop:'<rect x="3" y="4" width="18" height="13" rx="3"/><path d="M8 21h8M12 17v4"/>'
  };
  function iconSVG(name){if(!iconPaths[name])throw new Error('Unknown UI icon: '+name);return '<svg class="ui-icon-svg" data-ui-icon="'+name+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+iconPaths[name]+'</svg>'}
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
  window.SahkoUI={iconSVG,iconLabel,roomHeader,rosterOverflow};
})();
