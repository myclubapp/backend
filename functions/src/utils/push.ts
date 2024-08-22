/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../firebaseSingleton";
import webpush = require("web-push");
import {Messaging} from "firebase-admin/lib/messaging/messaging";
import {DataMessagePayload, Message, NotificationMessagePayload} from "firebase-admin/lib/messaging/messaging-api";

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendPushNotificationByUserProfileId(userProfileId: string, title: string, message: string, data: any) {
  try {
    const userProfilePushRef = await db.collection("userProfile").doc(userProfileId).collection("push").get();

    // SAVE Notification to user profile
    await db.collection("userProfile").doc(userProfileId).collection("notification").add({
      title: title,
      message: message,
      data: data,
      date: new Date(),
      opened: false,
    });

    const notificationsRef = await db.collection("userProfile").doc(userProfileId).collection("notification").where("opened", "==", false).get();
    const badgeCount: string = notificationsRef.docs.length || 1;

    // SEND PUSH NOTIFICATIONs
    for (const push of userProfilePushRef.docs) {
      const pushData = push.data();
      console.log(">> PUSH DEVICE: ", pushData);

      if (pushData.platform === "web") {
        // Send WebPush
        const {statusCode, headers, body} = await webpush.sendNotification(
            JSON.parse(pushData.pushObject),
            JSON.stringify({
              title: title,
              message: message,
            })
        );
        console.log(">> SEND WEB PUSH EVENT: ", statusCode, headers, body);
      } else {
        // Send native Push
        try {
          const nativePush = await messaging.send({
            token: pushData.token,
            notification: <NotificationMessagePayload>{
              title: title,
              body: message,
              sound: "default",
              badge: badgeCount,
            },
            data: <DataMessagePayload>{
              ...data,
            },
          });
          console.log(">> SEND NATIVE PUSH EVENT: ", nativePush);
        } catch (e) {
          console.log("Error Sending Native Push to Device:  " + push.id + " / Identifier: " + pushData.identifier + " with Error " + e);
        }
      }
    }
  } catch (e) {
    console.error("Error sending push notification: ", e);
  }
}
