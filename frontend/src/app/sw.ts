import { type PrecacheEntry, Serwist, StaleWhileRevalidate, CacheFirst, ExpirationPlugin } from "serwist";
import pkg from "../../package.json";

const VERSION = pkg.version;

declare const self: ServiceWorkerGlobalScope & {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: false,
    clientsClaim: false,
    navigationPreload: true,
    runtimeCaching: [
        {
            matcher: ({ request }) => request.destination === "style" || request.destination === "script" || request.destination === "worker",
            handler: new StaleWhileRevalidate({
                cacheName: "static-resources",
            }),
        },
        {
            matcher: ({ request }) => request.destination === "image",
            handler: new CacheFirst({
                cacheName: "images",
                plugins: [
                    new ExpirationPlugin({
                        maxEntries: 50,
                        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
                    }),
                ],
            }),
        },
    ],
});

serwist.addEventListeners();

// Push notification handling
self.addEventListener("push", (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: "/logos/HZD-logo256-hovawart-zuchtgemeinschaft-deutschland.png",
            badge: "/logos/HZD-logo256-hovawart-zuchtgemeinschaft-deutschland.png",
            data: {
                url: data.url || "/",
            },
        };
        event.waitUntil(self.registration.showNotification(data.title, options));
    }
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(self.clients.openWindow(event.notification.data.url));
});

self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
    if (event.data && event.data.type === "GET_VERSION") {
        event.ports[0].postMessage({ version: VERSION });
    }
});
