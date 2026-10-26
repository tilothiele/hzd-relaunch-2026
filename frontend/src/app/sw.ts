import {
	type PrecacheEntry,
	Serwist,
	StaleWhileRevalidate,
	CacheFirst,
	ExpirationPlugin,
} from "serwist";
import pkg from "../../package.json";

const VERSION = pkg.version;

declare const self: ServiceWorkerGlobalScope & {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: false,
    clientsClaim: false,
    // navigationPreload bleibt aus, damit Auth-Requests nicht doppelt laufen.
    navigationPreload: false,
    // /api/auth nicht vom SW abfangen: Login, Logout und Passwort-Reset
    // müssen immer live gegen das Next.js-BFF gehen.
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

const NOTIFICATION_ICON = "/logos/HZD-logo256-hovawart-zuchtgemeinschaft-deutschland.png";

// Push notification handling
self.addEventListener("push", (event) => {
    const show = (async () => {
        let title = "HZD Benachrichtigung";
        let body = "";
        let url = "/";

        if (event.data) {
            const raw = event.data.text();
            try {
                const data = JSON.parse(raw) as {
                    title?: string;
                    body?: string;
                    url?: string;
                    data?: { url?: string };
                };
                title = data.title || title;
                body = data.body || "";
                url = data.data?.url || data.url || "/";
            } catch {
                body = raw;
            }
        }

        await self.registration.showNotification(title, {
            body,
            icon: NOTIFICATION_ICON,
            badge: NOTIFICATION_ICON,
            data: { url },
        });
    })();

    event.waitUntil(show);
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data?.url || "/";
    event.waitUntil(self.clients.openWindow(url));
});

self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
    if (event.data && event.data.type === "GET_VERSION") {
        event.ports[0].postMessage({ version: VERSION });
    }
});
