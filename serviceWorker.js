const CACHE_NAME = 'campuscare-cache-v4';

const APP_SHELL_ASSETS = [
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './images/icon-192.png',
    './images/icon-512.png',
    './images/icon-maskable-512.png',
    './images/apple-touch-icon.png'
];

async function precacheAssets() {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL_ASSETS);
}

self.addEventListener('install', (event) => {
    event.waitUntil(precacheAssets().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

    event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
    const isNavigation =
        request.mode === 'navigate' ||
        (request.headers.get('accept') || '').includes('text/html');

    if (isNavigation) {
        try {
            const networkResponse = await fetch(request);
            if (networkResponse && networkResponse.ok) {
                const cache = await caches.open(CACHE_NAME);
                cache.put('./index.html', networkResponse.clone());
            }
            return networkResponse;
        } catch (error) {
            const cachedPage = await caches.match('./index.html') || await caches.match(request);
            if (cachedPage) return cachedPage;
            return offlineResponse();
        }
    }

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        return offlineResponse();
    }
}

function offlineResponse() {
    return new Response('Sin conexión', {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
}
