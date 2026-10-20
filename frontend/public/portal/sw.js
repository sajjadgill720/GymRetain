/* Cache the public offline shell only. Never cache member API responses or pass images. */
const CACHE='gymretain-member-shell-v1';
const SHELL='/portal/offline.html';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([SHELL,'/portal/icon-192.png','/portal/icon-512.png'])));self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('gymretain-member-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||event.request.mode!=='navigate'||new URL(event.request.url).origin!==self.location.origin||!new URL(event.request.url).pathname.startsWith('/portal'))return;
 event.respondWith(fetch(event.request).catch(()=>caches.match(SHELL)));
});
self.addEventListener('push',event=>{
 let message={title:'GymRetain',body:'You have an update from your gym.'};try{message={...message,...event.data.json()};}catch{}
 event.waitUntil(self.registration.showNotification(message.title,{body:message.body,icon:'/portal/icon-192.png',badge:'/portal/icon-192.png',data:{url:'/portal'}}));
});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.matchAll({type:'window'}).then(clients=>{const existing=clients.find(client=>new URL(client.url).pathname.startsWith('/portal'));return existing?existing.focus():self.clients.openWindow('/portal');}));});
