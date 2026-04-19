// v3 — fix: use listDocuments() for reliable FCM token fetching
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendWaterReminders = functions
  .region("asia-southeast2")
  .pubsub.schedule("0 8,10,12,14,16,18,20,21 * * *")
  .timeZone("Asia/Jakarta")
  .onRun(async (context) => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const currentHour = now.getHours();

    let notificationTitle = "Hydration Check 💧";
    let notificationBody = "Keep hydrating! It's time to drink some water 🥤";

    if (currentHour === 8) {
      notificationTitle = "Good Morning! ☀️";
      notificationBody = "New day, new streak! Let's drink some water 💧";
    } else if (currentHour === 21) {
      notificationTitle = "Night Routine 🌙";
      notificationBody = "Don't forget to track your daily water before you sleep!";
    }

    try {
      // Use listDocuments() — works reliably unlike .get() on large collections
      const usersRef = admin.firestore().collection("artifacts").doc("water-tracker-kita").collection("users");
      const userDocs = await usersRef.listDocuments();
      const tokens = [];

      for (const userDocRef of userDocs) {
        try {
          const fcmTokenDoc = await userDocRef.collection("data").doc("fcmToken").get();
          if (fcmTokenDoc.exists) {
            const tokenData = fcmTokenDoc.data();
            if (tokenData && tokenData.token) {
              tokens.push(tokenData.token);
            }
          }
        } catch (e) {
          console.log(`Could not read token for ${userDocRef.id}:`, e.message);
        }
      }

      if (tokens.length === 0) {
        console.log("No FCM tokens found.");
        return null;
      }

      console.log(`Sending notification to ${tokens.length} devices.`);

      const response = await admin.messaging().sendEachForMulticast({
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        android: {
          priority: 'high',
          notification: {
            priority: 'max',
            defaultSound: true,
            channelId: 'water-reminders',
          }
        },
        apns: {
          headers: {
            'apns-priority': '10',
          }
        },
        tokens: tokens,
      });

      console.log(response.successCount + " messages were sent successfully.");
      if (response.failureCount > 0) {
        console.log(response.failureCount + " messages failed.");
      }

    } catch (error) {
      console.error("Error sending push notifications:", error);
    }

    return null;
  });
