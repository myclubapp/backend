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
  const club = clubRef.data();
  const userProfileRef = await db.collection("userProfile").doc(userId).get();
  const user = userProfileRef.data();

  await db.collection("club").doc(clubId).collection("requests").doc(userId).set({
    "userProfileRef": userProfileRef.ref,
  });

  if (club && club.active == false) {
    // club ist noch nicht aktiv. -> Prüfen ob in der Contactliste eingetragen
    const contactDataRef = await db.collection("club").doc(clubId).collection("contacts").where("email", "==", user.email).get();
    if (contactDataRef.docs.length > 0) {
      // ACTIVATE CLUB!
      await db.collection("club").doc(clubId).set({
        active: true,
      }, {merge: true});
      // Request kann angenommen werden.
      await db.collection("club").doc(clubId).collection("requests").doc(userId).set({
        "userProfileRef": userProfileRef.ref,
        "approveDateTime": Date.now(),
        "approve": true,
        "isAdmin": true,
      });
    } else {
      // E-Mail, dass Request gelöscht wurde, da nicht bereichtig. Bitte info@my-club.app kontaktieren, sollte es sich um einen Fehler handeln.
      // Wird via Request rejected Methode gemacht. daher zuerst request ablehnen.
      await db.collection("club").doc(clubId).collection("requests").doc(userId).set({
        "userProfileRef": userProfileRef.ref,
        "approveDateTime": Date.now(),
        "approve": false,
        "isAdmin": false,
      });
    }
  } else {
    // Club ist aktiv, normales Prozedere
    // SEND E-MAIL AND PUSH TO USER
    if (userProfileRef.exists) {
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
          /* const nativePush = await messaging.sendToDevice(push.data().token,
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
          );*/
          // console.log(">> SEND Native PUSH EVENT: ", nativePush);
        }
      }
    }
    // SEND E-MAIL AND PUSH TO USER
    if (userProfileRef.exists) {
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
            try {
              const nativePush = await messaging.sendToDevice(push.data().token, {
                notification: <NotificationMessagePayload>{
                  title: "Neue Beitrittsanfrage für deinen Verein: " + clubRef.data().name,
                  body: `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) möchte deinem Verein beitreten.`,
                  sound: "default",
                  badge: "0",
                },
                data: <DataMessagePayload>{
                  "type": "clubRequestAdmin",
                  "clubId": clubId,
                  "id": clubId,
                },
              },
              );
              console.log(">> SEND Native PUSH EVENT: ", nativePush);
            } catch (e) {
              console.log("Error Sending Push to Device:  " + push.id + " / Identifier: " + push.data().identifier + " with Error " + e);
            }
          }
        }
      }
      if (adminRef.exists && adminRef.data().settingsEmail === true) {
        receipient.push(adminRef.data().email);
      }
    }

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
  }
  return true;
}
