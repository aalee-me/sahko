import {companionAPI} from '../../backend/companion.mjs';
export default {
 async fetch(request,env){const url=new URL(request.url);if(!url.pathname.startsWith('/api/companion/pairs'))return new Response('Not found',{status:404});return companionAPI(request,env)},
 async scheduled(_event,env){await env.DB.prepare('DELETE FROM companion_pairs WHERE expires<?').bind(Date.now()).run();await env.DB.prepare('DELETE FROM companion_phone_events WHERE received_at<?').bind(Date.now()-86400000).run()}
};
