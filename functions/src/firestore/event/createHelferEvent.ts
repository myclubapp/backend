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

export async function createHelferEvent(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("CREATE Helferevent");

  const userId = context.params.userId;
  const eventId = context.params.eventId;

  console.log("userId: " + userId);
  console.log("HelfereventId: " + eventId);

  const eventData = snapshot.data();
  const clubRef = await db.collection("club").doc(eventData.clubId).get();
  console.log(clubRef.id);

  const schichten = eventData.schichten;
  delete eventData.schichten;

  // create helferevent
  const newHelferEventRef = await db.collection("club").doc(clubRef.id).collection("helferEvents").add({
    ...eventData,
  });

  // if schichten, create them as well
  for (const schicht of schichten) {
    const newHelferSchicht = await db.collection("club").doc(clubRef.id).collection("helferEvents").doc(newHelferEventRef.id).collection("schichten").add({
      ...schicht,
    });
    console.log("new schicht added: " + newHelferSchicht.id);
  }

  console.log("New Helferevent created: " + newHelferEventRef.id);
  return db.collection("userProfile").doc(userId).collection("helferEvents").doc(eventId).delete();
}

export async function createNotificationHelferEvent(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  const clubId = context.params.clubId;
  const eventId = context.params.eventId;
  console.log(clubId, eventId);

  const helferEvent = await db.collection("club").doc(clubId).collection("helferEvents").doc(eventId).get();
  const clubMembersRef = await db.collection("club").doc(clubId).collection("members").get();
  for (const clubMember of clubMembersRef.docs) {
    const userProfileRef = await db.collection("userProfile").doc(clubMember.id).get();
    if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushHelfer) {
      const userProfilePushRef = await db.collection("userProfile").doc(clubMember.id).collection("push").get();
      for (const push of userProfilePushRef.docs) {
        console.log(">> PUSH DEVICE: ", push.data());
        if (push.data().platform === "web") {
          // Send WebPush
          const {statusCode, headers, body} = await webpush.sendNotification(JSON.parse(push.data().pushObject),
              JSON.stringify({
                title: "Neuer Helferevent verfügbar: " + helferEvent.data().name,
                message: "Details: " + helferEvent.data().description,
              }));
          console.log(">> SEND PUSH EVENT: ", statusCode, headers, body);
        } else {
          // Send native Push
          try {
            const nativePush = await messaging.sendToDevice(push.data().token,
                {
                  notification: <NotificationMessagePayload>{
                    title: "Neuer Helferevent verfügbar",
                    body: helferEvent.data().name + " - " + helferEvent.data().description,
                    sound: "default",
                    badge: "0",
                  },
                  data: <DataMessagePayload>{
                    "type": "helferEvent",
                    "clubId": clubId,
                    "id": helferEvent.data().id,
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
