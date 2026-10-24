// Local-only companion relay. Deliberately does not expose authenticated room/account APIs.
import https from 'node:https';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {companionAPI} from '../backend/companion.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function createWifiServer({origin,cert,key,database=':memory:'}){
 const publicURL=new URL(origin);if(publicURL.protocol!=='https:'||publicURL.username||publicURL.password||publicURL.pathname!=='/'||publicURL.search||publicURL.hash)throw Error('Use an HTTPS origin without a path.');
 const db=new DatabaseSync(database);db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');
 // This database contains pairing capabilities and processed state only.
 db.exec('CREATE TABLE IF NOT EXISTS __wifi_migrations (name TEXT PRIMARY KEY)');
 for(const name of ['0010_desktop_companion.sql','0011_phone_motion.sql'])if(!db.prepare('SELECT name FROM __wifi_migrations WHERE name=?').get(name)){db.exec('BEGIN');try{db.exec(fs.readFileSync(path.join(root,'migrations',name),'utf8'));db.prepare('INSERT INTO __wifi_migrations VALUES(?)').run(name);db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}}
 const DB={prepare(sql){let values=[];return{bind(...v){values=v;return this},async first(){return db.prepare(sql).get(...values)||null},async all(){return{results:db.prepare(sql).all(...values)}},async run(){return db.prepare(sql).run(...values)}}}};
 const server=https.createServer({cert,key},async(req,res)=>{const respond=(status,body,type='text/plain')=>{res.writeHead(status,{'content-type':type,'cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff','permissions-policy':'accelerometer=(self), gyroscope=(self), microphone=(self)'});res.end(body)};
 try{
  // Exact host and origin checks prevent unrelated sites from using this LAN listener.
  if(req.headers.host!==publicURL.host)return respond(403,'Unknown local host');
  const url=new URL(req.url,origin);if(req.headers.origin&&req.headers.origin!==origin)return respond(403,'Origin not allowed');
  if(url.pathname.startsWith('/api/companion/pairs')){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>10000)return respond(413,'Payload too large');chunks.push(chunk)}const headers=new Headers(req.headers);headers.set('cf-connecting-ip',req.socket.remoteAddress||'local');const request=new Request(url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});const response=await companionAPI(request,{DB,COMPANION_ALLOWED_ORIGIN:origin});res.writeHead(response.status,{...Object.fromEntries(response.headers),'x-content-type-options':'nosniff'});return res.end(Buffer.from(await response.arrayBuffer()))}
  if(url.pathname.startsWith('/api/'))return respond(404,'Only companion pairing is available on this local relay.');
  if(!['GET','HEAD'].includes(req.method))return respond(405,'Method not allowed');
  if(url.pathname==='/wifi-config.js')return respond(200,'window.sahkoCompanionLocal=true;','application/javascript');
  const name=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname),file=path.resolve(root,'frontend','.'+name);if(!file.startsWith(path.join(root,'frontend')+path.sep))return respond(403,'Not allowed');
  let data=fs.readFileSync(file);if(name==='/index.html')data=Buffer.from(data.toString().replace('</head>','<script src="wifi-config.js"></script><script src="static-demo.js"></script></head>'));
  const types={'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.html':'text/html; charset=utf-8'};respond(200,req.method==='HEAD'?'':data,types[path.extname(file)]||'application/octet-stream');
 }catch(e){respond(e.code==='ENOENT'?404:500,e.code==='ENOENT'?'Not found':'Local relay unavailable')}});
 server.on('close',()=>db.close());return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const dir=path.join(root,'.sahko-wifi');let config;try{config=JSON.parse(fs.readFileSync(path.join(dir,'config.json')))}catch{console.error('Run npm run wifi:setup first. See docs/WIFI-SYNC.md.');process.exit(1)}
 const server=createWifiServer({origin:config.origin,cert:fs.readFileSync(path.join(dir,'cert.pem')),key:fs.readFileSync(path.join(dir,'key.pem')),database:path.join(dir,'pairs.sqlite')});server.on('error',e=>{console.error(e.message);process.exitCode=1});server.listen(new URL(config.origin).port||443,'0.0.0.0',()=>console.log('Sähkö Wi-Fi sync: '+config.origin+'\nUse this address in Mac Settings and on your phone. Keep this process and your Mac awake.'));
}
