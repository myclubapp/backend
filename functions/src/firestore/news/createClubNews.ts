/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";

const db = firebaseDAO.instance.db;

const gcmAPIKey = functions.config().webpush.gcmapikey;
const publicKey = functions.config().webpush.publickey;
const privateKey = functions.config().webpush.privatekey;

const webpush = require("web-push");
webpush.setGCMAPIKey(gcmAPIKey);
webpush.setVapidDetails(
    "mailto:info@my-club.app",
    publicKey,
    privateKey
);
export async function createNotificationClubNews(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  const clubId = context.params.clubId;
  const newsId = context.params.newsId;
  console.log(clubId, newsId);

  const clubNewsRef = await db.collection("club").doc(clubId).collection("news").doc(newsId).get();
  const clubMembersRef = await db.collection("club").doc(clubId).collection("members").get();
  for (const clubMember of clubMembersRef.docs) {
    const userProfileRef = await db.collection("userProfile").doc(clubMember.id).get();
    if (userProfileRef.data().settingsPush) {
      const userProfilePushRef = await db.collection("userProfile").doc(clubMember.id).collection("push").get();
      for (const push of userProfilePushRef.docs) {
        const {statusCode, headers, body} = await webpush.sendNotification(push.data().pushObject,
            JSON.stringify( {
              title: clubNewsRef.data().title,
              message: clubNewsRef.data().text,
            }));
        console.log(">> SEND PUSH: ", statusCode, headers, body);
      }
    }
  }
}
