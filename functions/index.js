const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// ==========================
// 🔥 CRON FUNCTION (ASLI)
// ==========================
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

    await sendPush(notificationTitle, notificationBody);
    return null;
  });


// ==========================
// 🔥 TEST MANUAL (PAKAI INI)
// ==========================
exports.testPushNow = functions
  .region("asia-southeast2")
  .https.onRequest(async (req, res) => {
    try {
      await sendPush(
        "TEST PUSH 💧",
        "Kalau ini muncul di Android, berarti sudah fix."
      );

      res.send("Push sent");
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  });


// ==========================
// 🔥 CORE SENDER FUNCTION
// ==========================
async function sendPush(title, body) {
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
    console.log("No tokens found");
    return;
  }

  console.log(`Sending to ${tokens.length} devices`);

  const response = await admin.messaging().sendEachForMulticast({
    notification: {
      title,
      body,
    },

    // 🔥 PENTING UNTUK PWA ANDROID
    webpush: {
      headers: {
        Urgency: "high",
      },
      notification: {
        title,
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "water-reminder",
        requireInteraction: true,
      },
      fcmOptions: {
        link: "https://moodengwaterclub.vercel.app/",
      },
    },

    android: {
      priority: "high",
      notification: {
        priority: "max",
        defaultSound: true,
        channelId: "water-reminders",
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

  response.responses.forEach((r, i) => {
    if (!r.success) {
      console.error("FAILED TOKEN:", {
        token: tokens[i],
        code: r.error?.code,
        message: r.error?.message,
      });
    }
  });
}