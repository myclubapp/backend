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

export async function createNotificationClubNews(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  const clubId = context.params.clubId;
  const newsId = context.params.newsId;
  console.log(clubId, newsId);

  const clubNewsRef = await db.collection("club").doc(clubId).collection("news").doc(newsId).get();
  const clubMembersRef = await db.collection("club").doc(clubId).collection("members").get();
  for (const clubMember of clubMembersRef.docs) {
    const userProfileRef = await db.collection("userProfile").doc(clubMember.id).get();
    if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushNews) {
      await sendPushNotificationByUserProfileId(
          clubMember.id,
          "Neuer News Beitrag verfügbar: ",
          clubNewsRef.data().title,
          {
            "type": "clubNews",
            "id": clubNewsRef.id,
            "clubId": clubId,
            "image": clubNewsRef.data().image,
            "leadText": clubNewsRef.data().image,
            "text": clubNewsRef.data().image,
            "author": clubNewsRef.data().author,
            "authorImage": clubNewsRef.data().authorImage,
            "slug": clubNewsRef.data().slug,
            "title": clubNewsRef.data().title,
            "url": clubNewsRef.data().url,
          }
      );
    }
  }
}
