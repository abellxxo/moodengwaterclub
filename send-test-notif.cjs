// Sends test push notification to all users
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Windows SSL fix (local only)
const admin = require('./functions/node_modules/firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('./service-account.json')),
  projectId: 'water-tracker-kita'
});

async function sendTestNotification() {
  const db = admin.firestore();
  const tokens = [];

  console.log('📡 Fetching FCM tokens from Firestore...');
  
  // Use listDocuments() instead of get() — more reliable with Admin SDK
  const usersRef = db.collection('artifacts').doc('water-tracker-kita').collection('users');
  const userDocs = await usersRef.listDocuments();

  for (const userDocRef of userDocs) {
    try {
      const fcmTokenDoc = await userDocRef.collection('data').doc('fcmToken').get();
      if (fcmTokenDoc.exists) {
        const tokenData = fcmTokenDoc.data();
        if (tokenData && tokenData.token) {
          tokens.push(tokenData.token);
          console.log(`✅ Token found for user: ${userDocRef.id}`);
        }
      }
    } catch (e) {
      console.log(`⚠️ Could not read token for ${userDocRef.id}:`, e.message);
    }
  }

  if (tokens.length === 0) {
    console.log('❌ No FCM tokens found!');
    process.exit(0);
  }

  console.log(`\n🚀 Sending to ${tokens.length} device(s)...`);

  const response = await admin.messaging().sendEachForMulticast({
    notification: {
      title: '🌙 Night Reminder',
      body: "Don't forget to turn in your daily water today! 💧"
    },
    tokens
  });

  console.log(`✅ Sent: ${response.successCount} | ❌ Failed: ${response.failureCount}`);
  if (response.failureCount > 0) {
    response.responses.forEach((r, i) => {
      if (!r.success) console.log(`   Token ${i}: ${r.error?.message}`);
    });
  }

  process.exit(0);
}

sendTestNotification().catch(err => { console.error('Error:', err); process.exit(1); });
