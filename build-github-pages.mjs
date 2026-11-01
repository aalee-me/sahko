import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),out=path.join(root,'pages');
fs.rmSync(out,{recursive:true,force:true});
fs.cpSync(path.join(root,'frontend'),out,{recursive:true,filter:source=>path.basename(source)!=='original-studio.html'});
const entry=path.join(out,'index.html');
fs.writeFileSync(entry,fs.readFileSync(entry,'utf8').replace('</head>','<script src="static-demo.js?v=accounts23"></script></head>'));
fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log('GitHub Pages desktop and mobile demo:',out);
// The browser host reuses the exact room authorization/timer API in memory.
const peerBackend=path.join(out,'peer-backend');fs.mkdirSync(peerBackend,{recursive:true});
for(const name of ['api.mjs','companion.mjs','clouds.mjs'])fs.writeFileSync(path.join(peerBackend,name),fs.readFileSync(path.join(root,'backend',name),'utf8').replace("'../frontend/cloud-policy.js'","'../cloud-policy.js'"));
fs.writeFileSync(path.join(peerBackend,'migrations.json'),JSON.stringify(fs.readdirSync(path.join(root,'migrations')).filter(name=>name.endsWith('.sql')).sort().map(name=>fs.readFileSync(path.join(root,'migrations',name),'utf8'))));
