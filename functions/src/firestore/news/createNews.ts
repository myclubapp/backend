/* eslint-disable linebreak-style */
/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../../firebaseSingleton";
import webpush = require("web-push");
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";

const db = firebaseDAO.instance.db;

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
  // Get type

  // Get
  const associationClubs = await db.collection("club").where("type", "==", newsRef.data().type).where("active", "==", true).get();
  for (const club of associationClubs.docs) {
    const clubMembersRef = await db.collection("club").doc(club.id).collection("members").get();
    for (const clubMember of clubMembersRef.docs) {
      const userProfileRef = await db.collection("userProfile").doc(clubMember.id).get();
      if (userProfileRef.exists && userProfileRef.data().settingsPush) {
        const userProfilePushRef = await db.collection("userProfile").doc(clubMember.id).collection("push").get();
        for (const push of userProfilePushRef.docs) {
          const {statusCode, headers, body} = await webpush.sendNotification(JSON.parse(push.data().pushObject),
              JSON.stringify({
                title: newsRef.data().title,
                message: newsRef.data().text,
              }));
          console.log(">> SEND PUSH: ", statusCode, headers, body);
        }
      }
    }
  }
}