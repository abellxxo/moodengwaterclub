const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendWaterReminders = functions
  .region("asia-southeast2") // Jakarta / nearest region
  .pubsub.schedule("0 8,10,12,14,16,18,20,21 * * *")
  .timeZone("Asia/Jakarta")
  .onRun(async (context) => {
    // Determine current hour in Jakarta timezone
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

    // 1. Fetch all FCM tokens from Firestore
    // Collection path based on AppContext: artifacts/water-tracker-kita/users/{uid}/data/fcmToken
    const tokens = [];
    try {
      const usersRef = admin.firestore().collection("artifacts").doc("water-tracker-kita").collection("users");
      const usersSnapshot = await usersRef.get();

      for (const userDoc of usersSnapshot.docs) {
        const fcmTokenDoc = await userDoc.ref.collection("data").doc("fcmToken").get();
        if (fcmTokenDoc.exists) {
          const tokenData = fcmTokenDoc.data();
          if (tokenData && tokenData.token) {
            tokens.push(tokenData.token);
          }
        }
      }

      if (tokens.length === 0) {
        console.log("No FCM tokens found.");
        return null;
      }

      console.log(`Sending notification to ${tokens.length} devices.`);

      // 2. Send multicast message
      const message = {
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        tokens: tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(response.successCount + " messages were sent successfully.");
      if (response.failureCount > 0) {
        console.log(response.failureCount + " messages failed.");
      }

    } catch (error) {
      console.error("Error sending push notifications:", error);
    }

    return null;
  });
