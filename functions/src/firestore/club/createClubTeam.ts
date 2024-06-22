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

export async function addClubTeam(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("Add New Team to Club");

  const clubId = context.params.clubId;
  const teamId = context.params.teamId;

  console.log("clubId: " + clubId);
  console.log("teamId: " + teamId);

  const teamData = snapshot.data();
  const clubRef = await db.collection("club").doc(clubId).get();

  const teamRef = await db.collection("teams").doc(teamId).add({
    ...teamData,
    externalId: "-",
    logo: "-",
    type: "Manual",
    updated: new Date(),
    clubId: clubId,
    clubRef: clubRef.ref,
  });

  return db.collection("club").doc(clubId).collection("teams").doc(teamId).add({
    teamRef: teamRef.ref,
  });
}

export async function createNotificationClubEvent(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  const clubId = context.params.clubId;
  const eventId = context.params.eventId;
  console.log(clubId, eventId);

  const clubEventRef = await db.collection("club").doc(clubId).collection("events").doc(eventId).get();
  const clubMembersRef = await db.collection("club").doc(clubId).collection("members").get();
  for (const clubMember of clubMembersRef.docs) {
    const userProfileRef = await db.collection("userProfile").doc(clubMember.id).get();
    if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushEvent) {
      const userProfilePushRef = await db.collection("userProfile").doc(clubMember.id).collection("push").get();
      for (const push of userProfilePushRef.docs) {
        console.log(">> PUSH DEVICE: ", push.data());
        if (push.data().platform === "web") {
          // Send WebPush
          const {statusCode, headers, body} = await webpush.sendNotification(JSON.parse(push.data().pushObject),
              JSON.stringify({
                title: "Neue Veranstaltung verfügbar",
                message: clubEventRef.data().name + " - " + clubEventRef.data().description,
              }));
          console.log(">> SEND PUSH EVENT: ", statusCode, headers, body);
        } else {
          // Send native Push
          try {
            const nativePush = await messaging.sendToDevice(push.data().token,
                {
                  notification: <NotificationMessagePayload>{
                    title: "Neue Veranstaltung verfügbar",
                    body: clubEventRef.data().name + " - " + clubEventRef.data().description,
                    sound: "default",
                    badge: "0",
                  },
                  data: <DataMessagePayload>{
                    "type": "clubEvent",
                    "clubId": clubId,
                    "id": clubEventRef.data().id,
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
