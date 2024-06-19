/* eslint-disable linebreak-style */
/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";
import webpush = require("web-push");
import {Messaging} from "firebase-admin/lib/messaging/messaging";
import {DataMessagePayload, NotificationMessagePayload} from "firebase-admin/lib/messaging/messaging-api";

const db = firebaseDAO.instance.db;
const messaging: Messaging = firebaseDAO.instance.messaging;

const gcmAPIKey = functions.config().webpush.gcmapikey;
const publicKey = functions.config().webpush.publickey;
const privateKey = functions.config().webpush.privatekey;

webpush.setGCMAPIKey(gcmAPIKey);
webpush.setVapidDetails(
    "mailto:info@my-club.app",
    publicKey,
    privateKey
);

export async function createNotificationNews(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  const newsId = context.params.newsId;
  const newsRef = await db.collection("news").doc(newsId).get();

  const associationClubs = await db.collection("club").where("type", "==", newsRef.data().type).where("active", "==", true).get();
  for (const club of associationClubs.docs) {
    const clubMembersRef = await db.collection("club").doc(club.id).collection("members").get();
    for (const clubMember of clubMembersRef.docs) {
      const userProfileRef = await db.collection("userProfile").doc(clubMember.id).get();
      if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushNews) {
        const userProfilePushRef = await db.collection("userProfile").doc(clubMember.id).collection("push").get();
        for (const push of userProfilePushRef.docs) {
          console.log(">> PUSH DEVICE: ", push.data());
          if (push.data().platform === "web") {
            // Send WebPush
            const {statusCode, headers, body} = await webpush.sendNotification(JSON.parse(push.data().pushObject),
                JSON.stringify({
                  title: newsRef.data().title,
                  message: newsRef.data().text,
                }));
            console.log(">> SEND PUSH NEWS: ", statusCode, headers, body);
          } else {
            // Send native Push
            console.log(">> Message used ", {
              token: push.data().token,
              data: {
                title: newsRef.data().title,
                message: newsRef.data().text,
              },
            });

            delete newsRef.data().updated;
            try {
              const nativePush = await messaging.sendToDevice(push.data().token,
                  {
                    notification: <NotificationMessagePayload>{
                      title: newsRef.data().title,
                      body: newsRef.data().text,
                      sound: "default",
                      badge: "0",
                    },
                    data: <DataMessagePayload>{
                      "type": "news",
                      ...newsRef.data(),
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
    }
  }
}

