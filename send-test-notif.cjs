// One-time test notification sender
// Run with: node send-test-notif.js

const admin = require('./functions/node_modules/firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('./service-account.json')),
  projectId: 'water-tracker-kita'
});

async function sendTestNotification() {
  const db = admin.firestore();
  const tokens = [];

  console.log('📡 Fetching FCM tokens from Firestore...');
  const usersRef = db.collection('artifacts').doc('water-tracker-kita').collection('users');
  const usersSnapshot = await usersRef.get();

  for (const userDoc of usersSnapshot.docs) {
    const fcmTokenDoc = await userDoc.ref.collection('data').doc('fcmToken').get();
    if (fcmTokenDoc.exists) {
      const tokenData = fcmTokenDoc.data();
      if (tokenData && tokenData.token) {
        tokens.push(tokenData.token);
        console.log(`✅ Found token for user: ${userDoc.id}`);
      }
    }
  }

  if (tokens.length === 0) {
    console.log('❌ No FCM tokens found. Make sure users have enabled notifications in the app!');
    process.exit(0);
  }

  console.log(`\n🚀 Sending notification to ${tokens.length} device(s)...\n`);

  const message = {
    notification: {
      title: '💧 Hydration Check!',
      body: 'Please drink your water Moodeng friend 🦛'
    },
    tokens: tokens
  };

  const response = await admin.messaging().sendEachForMulticast(message);
  console.log(`✅ Success: ${response.successCount} sent`);
  if (response.failureCount > 0) {
    console.log(`❌ Failed: ${response.failureCount}`);
    response.responses.forEach((r, i) => {
      if (!r.success) console.log(`   Token ${i}: ${r.error?.message}`);
    });
  }

  process.exit(0);
}

sendTestNotification().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
