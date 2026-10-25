// Visibility preferences affect presentation only; saved dates and photos are retained.
(() => {
 const host=document.querySelector('#appSettings .general-settings');
 function preference(label,key,initial,className){const row=document.createElement('label');row.className='settings-option';const text=document.createElement('span');text.textContent=label;const input=document.createElement('input');input.type='checkbox';input.className='ui-switch';input.setAttribute('role','switch');let value=initial;try{const saved=localStorage.getItem(key);if(saved==='on'||saved==='off')value=saved==='on'}catch{}input.checked=value;const paint=()=>document.body.classList.toggle(className,!input.checked);input.onchange=()=>{paint();try{localStorage.setItem(key,input.checked?'on':'off')}catch{}};row.append(text,input);host.append(row);paint()}
 preference('Show task creation dates','sahko-show-task-dates',true,'hide-task-dates');
 preference('Show photo upload controls','sahko-show-photo-upload',false,'hide-photo-upload');
})();
