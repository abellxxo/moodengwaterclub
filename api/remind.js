// Vercel serverless function — sends a push notification reminder to a friend.
// POST /api/remind  { targetUid: string, message: string }
// Authorization: Bearer <firebase-id-token>

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (once)
if (!admin.apps.length) {
    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = admin.credential.cert(serviceAccount);
    } else {
        // Fallback: use Application Default Credentials (for local dev with gcloud auth)
        credential = admin.credential.applicationDefault();
    }

    admin.initializeApp({ credential });
}

const APP_ID = 'water-tracker-kita';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify Firebase ID token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization header' });
    }

    try {
        const idToken = authHeader.split('Bearer ')[1];
        await admin.auth().verifyIdToken(idToken);
    } catch (err) {
        console.error('Token verification failed:', err.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { targetUid, message } = req.body;
    if (!targetUid || !message) {
        return res.status(400).json({ error: 'Missing targetUid or message' });
    }

    try {
        // Fetch target user's FCM token
        const tokenDoc = await admin.firestore()
            .collection('artifacts').doc(APP_ID)
            .collection('users').doc(targetUid)
            .collection('data').doc('fcmToken')
            .get();

        if (!tokenDoc.exists || !tokenDoc.data()?.token) {
            return res.status(404).json({ error: 'Friend has no notification token registered' });
        }

        const fcmToken = tokenDoc.data().token;

        // Send the push notification — DATA-ONLY payload.
        // No top-level 'notification' key to prevent FCM auto-display (double notif).
        // Our service worker's raw 'push' listener handles display.
        await admin.messaging().send({
            data: {
                title: 'Water Reminder 💧',
                body: message,
            },
            webpush: {
                headers: {
                    Urgency: 'high',
                },
            },
            apns: {
                headers: {
                    'apns-priority': '10',
                    'apns-push-type': 'alert',
                },
                payload: {
                    aps: {
                        'content-available': 1,
                        alert: {
                            title: 'Water Reminder 💧',
                            body: message,
                        },
                        sound: 'default',
                    },
                },
            },
            token: fcmToken,
        });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error sending reminder:', err);
        return res.status(500).json({ error: 'Failed to send reminder' });
    }
};
