// Vercel serverless function — notifies group members when a user drinks water.
// POST /api/buddy-drink  { senderName: string, totalMl: number }
// Authorization: Bearer <firebase-id-token>

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (once)
if (!admin.apps.length) {
    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = admin.credential.cert(serviceAccount);
    } else {
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

    let senderUid;
    try {
        const idToken = authHeader.split('Bearer ')[1];
        const decoded = await admin.auth().verifyIdToken(idToken);
        senderUid = decoded.uid;
    } catch (err) {
        console.error('Token verification failed:', err.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { senderName, totalMl } = req.body;
    if (!senderName || !totalMl) {
        return res.status(400).json({ error: 'Missing senderName or totalMl' });
    }

    try {
        // Find sender's group
        const groupsRef = admin.firestore()
            .collection('artifacts').doc(APP_ID)
            .collection('groups');

        const groupSnap = await groupsRef
            .where('members', 'array-contains', senderUid)
            .get();

        if (groupSnap.empty) {
            return res.status(200).json({ success: true, sent: 0, reason: 'No group found' });
        }

        const group = groupSnap.docs[0].data();
        const friendUids = group.members.filter(uid => uid !== senderUid);

        if (friendUids.length === 0) {
            return res.status(200).json({ success: true, sent: 0, reason: 'No friends in group' });
        }

        // Get FCM tokens for all friends
        const tokens = [];
        for (const friendUid of friendUids) {
            try {
                const tokenDoc = await admin.firestore()
                    .collection('artifacts').doc(APP_ID)
                    .collection('users').doc(friendUid)
                    .collection('data').doc('fcmToken')
                    .get();

                if (tokenDoc.exists && tokenDoc.data()?.token) {
                    tokens.push(tokenDoc.data().token);
                }
            } catch (e) {
                console.log(`Could not read token for ${friendUid}:`, e.message);
            }
        }

        if (tokens.length === 0) {
            return res.status(200).json({ success: true, sent: 0, reason: 'No FCM tokens found' });
        }

        // Extract first name only
        const firstName = senderName.split(' ')[0];

        // Send push notification to all friends
        const response = await admin.messaging().sendEachForMulticast({
            data: {
                title: 'Moods Update 💧',
                body: `${firstName} baru minum ${totalMl}ml!`,
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
                        sound: 'default',
                    },
                },
            },
            tokens: tokens,
        });

        console.log(`Buddy drink: ${firstName} drank ${totalMl}ml → sent to ${response.successCount} devices`);

        return res.status(200).json({ success: true, sent: response.successCount });
    } catch (err) {
        console.error('Error sending buddy drink notification:', err);
        return res.status(500).json({ error: 'Failed to send notification' });
    }
}
