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

export async function createNotificationTeamNews(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  const teamId = context.params.teamId;
  const newsId = context.params.newsId;
  console.log(teamId, newsId);

  const teamNewsRef = await db.collection("teams").doc(teamId).collection("news").doc(newsId).get();
  const teamMembersRef = await db.collection("teams").doc(teamId).collection("members").get();
  for (const teamMember of teamMembersRef.docs) {
    const userProfileRef = await db.collection("userProfile").doc(teamMember.id).get();
    if (userProfileRef.data().settingsPush) {
      // const pushObject = JSON.parse(userProfileRef.data().pushObject);
      const userProfilePushRef = await db.collection("userProfile").doc(teamMember.id).collection("push").get();
      for (const push of userProfilePushRef.docs) {
        const {statusCode, headers, body} = await webpush.sendNotification(push.data().pushObject,
            JSON.stringify( {
              title: teamNewsRef.data().title,
              message: teamNewsRef.data().text,
            }));
        console.log(">> SEND PUSH: ", statusCode, headers, body);
      }
    }
  }
}
