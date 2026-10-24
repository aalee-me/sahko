import os from 'node:os';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dir=path.join(root,'.sahko-wifi');
if(Number(process.versions.node.split('.')[0])<24){console.error('Use Node 24 or newer.');process.exit(1)}
try{execFileSync('mkcert',['-version'],{stdio:'ignore'})}catch{console.error('Install the free mkcert utility first. On macOS with Homebrew: brew install mkcert\nThen run: mkcert -install\nSee docs/WIFI-SYNC.md for phone trust setup.');process.exit(1)}
const addresses=Object.values(os.networkInterfaces()).flat().filter(a=>a&&!a.internal&&a.family==='IPv4'&&/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a.address)).map(a=>a.address),ip=process.argv[2]||addresses[0];
if(!addresses.includes(ip)){console.error('Choose a private Wi-Fi IPv4 address on this computer: '+addresses.join(', '));process.exit(1)}
fs.mkdirSync(dir,{recursive:true,mode:0o700});execFileSync('mkcert',['-cert-file',path.join(dir,'cert.pem'),'-key-file',path.join(dir,'key.pem'),ip],{stdio:'inherit'});fs.chmodSync(path.join(dir,'key.pem'),0o600);
const origin='https://'+ip+':8443';fs.writeFileSync(path.join(dir,'config.json'),JSON.stringify({origin},null,2));const ca=execFileSync('mkcert',['-CAROOT'],{encoding:'utf8'}).trim();
console.log('\nWi-Fi address: '+origin+'\nInstall only '+path.join(ca,'rootCA.pem')+' on your own phone via AirDrop and enable certificate trust. Never share rootCA-key.pem.\nThen run npm run wifi and enter the Wi-Fi address in Mac Settings.');
