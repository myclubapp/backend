/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";
import {Change} from "firebase-functions";
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

export async function confirmHelferEvent(change: Change<QueryDocumentSnapshot>, context: functions.EventContext) {
  console.log("confirmHelferEvent /club/{clubId}/helferEvents/{eventId}/schichten/{schichtId}/attendees/{userId}");
  const clubId = context.params.clubId;
  const eventId = context.params.eventId;
  const schichtId = context.params.schichtId;
  const userId = context.params.userId;

  if (change.after.data().confirmed === true && change.before.data().confirmed !== true) {
    console.log("confirmed");

    const userRef = await db.collection("userProfile").doc(userId).get();
    const clubRef = await db.collection("club").doc(clubId).get();
    const helferEventRef = await db.collection("club").doc(clubId).collection("helferEvents").doc(eventId).get();
    const schichtRef = await db.collection("club").doc(clubId).collection("helferEvents").doc(eventId).collection("schichten").doc(schichtId).get();

    const helferPunktRef = await db.collection("club").doc(clubId).collection("helferPunkte").add({
      ...change.after.data(),
      userId: userId,
      userRef: userRef.ref,
      clubId: clubRef.id,
      clubRef: clubRef.ref,
      name: helferEventRef.data().name,
      eventRef: helferEventRef.ref,
      eventName: helferEventRef.data().name,
      eventDate: helferEventRef.data().date,
      points: change.after.data().points || 1,

      schichtRef: schichtRef.ref,
      schichtName: schichtRef.data().name,
      schichtTimeFrom: schichtRef.data().timeFrom,
      schichtTimeTo: schichtRef.data().timeTo,
    });

    // Send Push to Member
    const userProfileRef = await db.collection("userProfile").doc(userRef.id).get();
    if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushEvent) {
      const userProfilePushRef = await db.collection("userProfile").doc(userRef.id).collection("push").get();
      for (const push of userProfilePushRef.docs) {
        console.log(">> PUSH DEVICE: ", push.data());
        if (push.data().platform === "web") {
          // Send WebPush
          const {statusCode, headers, body} = await webpush.sendNotification(JSON.parse(push.data().pushObject),
              JSON.stringify({
                title: "Helfereinsatz bestätigt",
                message: "Dein Helfereinsatz am " + helferEventRef.data().name + " für die Schicht: " + schichtRef.data().name + " wurde bestätigt",
              }));
          console.log(">> SEND PUSH EVENT: ", statusCode, headers, body);
        } else {
          // Send native Push
          try {
            const nativePush = await messaging.sendToDevice(push.data().token,
                {
                  notification: <NotificationMessagePayload>{
                    title: "Helfereinsatz bestätigt",
                    body: "Dein Helfereinsatz am " + helferEventRef.data().name + " für die Schicht: " + schichtRef.data().name + " wurde bestätigt",
                    sound: "default",
                    badge: "0",
                  },
                  data: <DataMessagePayload>{
                    "type": "helferPunkt",
                    "id": helferPunktRef.id,
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

    // Set Helferpunkt Ref to HelferEinsatz
    return db.collection("club").doc(clubId).collection("helferEvents").doc(eventId).collection("schichten").doc(schichtId).collection("attendees").doc(userId).set({
      helferPunktRef: helferPunktRef.ref,
      helferPunktId: helferPunktRef.id,
    },
    {
      merge: true,
    });
  }
}
