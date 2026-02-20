import webpush from 'web-push';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const vapidKeys = {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    privateKey: process.env.VAPID_PRIVATE_KEY!,
};

webpush.setVapidDetails(
    'mailto:test@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// IMPORTANT: If you get "p256dh should be 65 bytes", you must:
// 1. Unsubscribe/Clear subscription in the browser.
// 2. Refresh the page.
// 3. Re-subscribe to get a NEW JSON object.
const pushSubscription = {
    "endpoint": process.env.TEST_PWA_ENDPOINT,
    "expirationTime": null,
    "keys": {
        "p256dh": process.env.TEST_PWA_P256DH,
        "auth": process.env.TEST_PWA_AUTH
    }
}

const payload = JSON.stringify({
    title: 'Test-Nachricht',
    body: 'Dies ist eine Push-Benachrichtigung von deiner HZD App!',
    url: '/'
});

console.log('Sending push notification...');

webpush.sendNotification(pushSubscription as any, payload)
    .then((result) => console.log('Successfully sent:', result.statusCode))
    .catch((error) => console.error('Error sending push:', error));
