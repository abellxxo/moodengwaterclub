const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendWaterReminders = functions
  .region("asia-southeast2")
  .pubsub.schedule("0 8,10,12,14,16,18,20,21 * * *")
  .timeZone("Asia/Jakarta")
  .onRun(async () => {

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
      const usersRef = admin.firestore()
        .collection("artifacts")
        .doc("water-tracker-kita")
        .collection("users");

      const userDocs = await usersRef.listDocuments();
      const tokens = [];

      for (const userDocRef of userDocs) {
        try {
          const fcmTokenDoc = await userDocRef.collection("data").doc("fcmToken").get();
          if (fcmTokenDoc.exists) {
            const token = fcmTokenDoc.data()?.token;
            if (token) tokens.push(token);
          }
        } catch (e) {
          console.log(`Error reading token for ${userDocRef.id}:`, e.message);
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

        // 🔥 IMPORTANT: WEB PUSH SUPPORT (Android PWA pakai ini)
        webpush: {
          headers: {
            Urgency: "high",
          },
          notification: {
            title: notificationTitle,
            body: notificationBody,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: "water-reminder",
            requireInteraction: true,
          },
          fcmOptions: {
            link: "https://water-tracker-kita.web.app/", // ganti sesuai domain
          },
        },

        android: {
          priority: "high",
          notification: {
            priority: "max",
            channelId: "water-reminders",
            defaultSound: true,
          },
        },

        apns: {
          headers: {
            "apns-priority": "10",
          },
        },

        tokens,
      });

      console.log(`${response.successCount} success`);
      console.log(`${response.failureCount} failed`);

      // 🔥 DEBUG TOKEN SATU-SATU
      response.responses.forEach((res, i) => {
        if (!res.success) {
          console.error("Failed token:", {
            token: tokens[i],
            code: res.error?.code,
            message: res.error?.message,
          });
        }
      });

    } catch (error) {
      console.error("Error sending notifications:", error);
    }

    return null;
  });