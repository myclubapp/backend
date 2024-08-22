/* eslint-disable linebreak-style */
/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";
import {sendPushNotificationByUserProfileId} from "../../utils/push";

const db = firebaseDAO.instance.db;

export async function createNotificationTeamNews(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  const teamId = context.params.teamId;
  const newsId = context.params.newsId;
  console.log(teamId, newsId);

  const teamNewsRef = await db.collection("teams").doc(teamId).collection("news").doc(newsId).get();
  const teamMembersRef = await db.collection("teams").doc(teamId).collection("members").get();
  for (const teamMember of teamMembersRef.docs) {
    const userProfileRef = await db.collection("userProfile").doc(teamMember.id).get();
    if (userProfileRef.data().settingsPush) {
      await sendPushNotificationByUserProfileId(
          teamMember.id,
          "Neuer News Beitrag verfügbar: ",
          teamNewsRef.data().title,
          {
            "type": "news",
            "id": teamNewsRef.id,
            "image": teamNewsRef.data().image,
            "leadText": teamNewsRef.data().image,
            "text": teamNewsRef.data().image,
            "author": teamNewsRef.data().author,
            "authorImage": teamNewsRef.data().authorImage,
            "slug": teamNewsRef.data().slug,
            "title": teamNewsRef.data().title,
            "url": teamNewsRef.data().url,
          }
      );
    }
  }
}
