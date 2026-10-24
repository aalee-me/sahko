/* Small DOM components shared by setup surfaces. Domain logic stays with callers. */
(() => {
  const node=(tag,className,text)=>{const element=document.createElement(tag);element.className=className;if(text!==undefined)element.textContent=text;return element};
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
  window.SahkoUI={iconLabel,roomHeader};
})();
