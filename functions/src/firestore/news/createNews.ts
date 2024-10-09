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

export async function createNotificationNews(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  const newsId = context.params.newsId;
  const newsRef = await db.collection("news").doc(newsId).get();

  const associationClubs = await db.collection("club").where("type", "==", newsRef.data().type).where("active", "==", true).get();
  for (const club of associationClubs.docs) {
    const clubMembersRef = await db.collection("club").doc(club.id).collection("members").get();
    for (const clubMember of clubMembersRef.docs) {
      const userProfileRef = await db.collection("userProfile").doc(clubMember.id).get();
      if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushNewsVerband) {
        await sendPushNotificationByUserProfileId(
            clubMember.id,
            "Neuer News Beitrag verfügbar: ",
            newsRef.data().title,
            {
              "type": "news",
              "id": newsRef.id,
              "image": newsRef.data().image,
              "leadText": newsRef.data().image,
              "text": newsRef.data().image,
              "author": newsRef.data().author,
              "authorImage": newsRef.data().authorImage,
              "slug": newsRef.data().slug,
              "title": newsRef.data().title,
              "url": newsRef.data().url,
            }
        );
      }
    }
  }
}

