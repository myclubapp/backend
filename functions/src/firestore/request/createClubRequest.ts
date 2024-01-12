/* eslint-disable linebreak-style */
/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../../firebaseSingleton";
// import webpush = require("web-push");
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";
import {Messaging} from "firebase-admin/lib/messaging/messaging";
import {DataMessagePayload, NotificationMessagePayload} from "firebase-admin/lib/messaging/messaging-api";

const db = firebaseDAO.instance.db;
const messaging: Messaging = firebaseDAO.instance.messaging;

/* const gcmAPIKey = functions.config().webpush.gcmapikey;
const publicKey = functions.config().webpush.publickey;
const privateKey = functions.config().webpush.privatekey;

webpush.setGCMAPIKey(gcmAPIKey);
webpush.setVapidDetails(
    "mailto:info@my-club.app",
    publicKey,
    privateKey
);*/

export async function createClubRequest(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("createClubRequest");
  const userId = context.params.userId;
  const clubId = context.params.clubId;

  const clubRef = await db.collection("club").doc(clubId).get();
  const userProfileRef = await db.collection("userProfile").doc(userId).get();

  await db.collection("club").doc(clubId).collection("requests").doc(userId).set({
    "userProfileRef": userProfileRef.ref,
  });

  if (userProfileRef.exists && userProfileRef.data().settingsPush) {
    const userProfilePushRef = await db.collection("userProfile").doc(userProfileRef.id).collection("push").get();
    for (const push of userProfilePushRef.docs) {
      console.log(">> PUSH DEVICE: ", push.data());
      if (push.data().platform === "web") {
        // Send WebPush
        /* const {statusCode, headers, body} = await webpush.sendNotification(JSON.parse(push.data().pushObject),
            JSON.stringify( {
              title: "Neue Beitrittsanfrage für deinen Verein: " + clubRef.data().name,
              message: `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) möchte deinem Verein beitreten.`,
            }));
        console.log(">> SEND PUSH EVENT: ", statusCode, headers, body); */
      } else {
        // Send native Push
        const nativePush = await messaging.sendToDevice(push.data().token,
            {
              notification: <NotificationMessagePayload> {
                title: "Neue Beitrittsanfrage für deinen Verein: " + clubRef.data().name,
                body: `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) möchte deinem Verein beitreten.`,
                sound: "default",
                badge: "0",
              },
              data: <DataMessagePayload> {
                "type": "clubRequest",
                "clubId": clubId,
                "id": clubId,
              },
            },
        );
        console.log(">> SEND Native PUSH EVENT: ", nativePush);
      }
    }
  }
  if (userProfileRef.exists && userProfileRef.data().settingsEmail === true) {
    // SEND REQUEST CONFIRMATION E-MAIL TO USER
    await db.collection("mail").add({
      to: userProfileRef.data()?.email,
      template: {
        name: "ClubRequestEmail",
        data: {
          clubName: clubRef.data().name,
          firstName: userProfileRef.data()?.firstName,
          lastName: userProfileRef.data()?.lastName,
        },
      },
    });
  }

  // SEND REQUEST E-MAIL TO CLUB ADMIN
  const receipient = [];
  console.log(`Get Admin from Club: ${clubId}`);
  const clubAdminRef = await db.collection("club").doc(clubId).collection("admins").get();

  for (const admin of clubAdminRef.docs) {
    const adminRef = await db.collection("userProfile").doc(admin.id).get();
    if (adminRef.exists && adminRef.data().settingsPush) {
      const userProfilePushRef = await db.collection("userProfile").doc(admin.id).collection("push").get();
      for (const push of userProfilePushRef.docs) {
        console.log(">> PUSH DEVICE: ", push.data());
        if (push.data().platform === "web") {
          // Send WebPush
          /* const {statusCode, headers, body} = await webpush.sendNotification(JSON.parse(push.data().pushObject),
              JSON.stringify( {
                title: "Neue Beitrittsanfrage für deinen Verein: " + clubRef.data().name,
                message: `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) möchte deinem Verein beitreten.`,
              }));
          console.log(">> SEND PUSH EVENT: ", statusCode, headers, body); */
        } else {
          // Send native Push
          const nativePush = await messaging.sendToDevice(push.data().token,
              {
                notification: <NotificationMessagePayload> {
                  title: "Neue Beitrittsanfrage für deinen Verein: " + clubRef.data().name,
                  body: `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) möchte deinem Verein beitreten.`,
                  sound: "default",
                  badge: "0",
                },
                data: <DataMessagePayload> {
                  "type": "clubRequest",
                  "clubId": clubId,
                  "id": clubId,
                },
              },
          );
          console.log(">> SEND Native PUSH EVENT: ", nativePush);
        }
      }
    }
    if (adminRef.exists && adminRef.data().settingsEmail === true) {
      receipient.push(adminRef.data().email);
    }
  }
  /*
  for (const admin of clubAdminRef.docs) {
    console.log(`Read Admin user for Club with id ${admin.id}`);
    const userProfileAdminRef = await db.collection("userProfile").doc(admin.id).get();
    if (userProfileAdminRef.exists) {
      if (userProfileAdminRef.data().settingsEmail === true) {
        receipient.push(userProfileAdminRef.data().email);
      }
      if (userProfileAdminRef.data().settingsPush === true) {
        const userProfilePushRef = await db.collection("userProfile").doc(admin.id).collection("push").get();
        for (const push of userProfilePushRef.docs) {
          const {statusCode, headers, body} = await webpush.sendNotification(JSON.parse(push.data().pushObject),
              JSON.stringify( {
                title: "Neue Beitrittsanfrage für deinen Verein: " + clubRef.data().name,
                message: `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) möchte deinem Verein beitreten.`,
              }));
          console.log(">> SEND PUSH: ", statusCode, headers, body);
        }
      }
    }
  }*/

  return db.collection("mail").add({
    to: receipient,
    template: {
      name: "ClubRequestAdminEmail",
      data: {
        clubName: clubRef.data().name,
        firstName: userProfileRef.data()?.firstName,
        lastName: userProfileRef.data()?.lastName,
        email: userProfileRef.data()?.email,
      },
    },
  });

  // check if user has admin claims..
  /*
  const adminUserRef = snapshot.data().userProfileRef || false;
  if (adminUserRef) { // only provided in team Page call
    const adminUser = await adminUserRef.get();
    const user = await auth.getUser(adminUser.id);
    if (user && user.customClaims && user.customClaims[teamId]) {
      const userRef = await db.collection("userProfile").doc(userId).get();
      await db.collection("teams").doc(teamId).collection("members").doc(`${userId}`).set({
        "userProfileRef": userRef,
      });
    }
  } */
}
