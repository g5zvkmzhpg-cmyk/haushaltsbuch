const C='hb-v481';const ASSETS=['./','index.html','style.css','app.js','manifest.json'];self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(ASSETS)))});self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))),self.clients.claim()])));self.addEventListener('fetch',e=>{if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{let copy=r.clone();caches.open(C).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./'))));return}e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(net=>{let copy=net.clone();caches.open(C).then(c=>c.put(e.request,copy));return net})))})
// Version 3.1 iOS dialog fix

// Version 4 visual dashboard

// Version 4.1 visual refinements

// Version 4.2 layout order

// Version 4.3 true donut + horizontal quick buttons

// Version 4.4 SVG donut

// Version 4.5 concept-matched dashboard

// Version 4.6 Monefy CSV import

// Version 4.7 transaction editing and deletion

// Version 4.7.1 edit transaction bugfix

// v4.7.2 Monefy import fix

// Version 4.7.3: dialogs before script + FileReader import

// Version 4.8 swipe month navigation

// Version 4.8.1 robust swipe navigation
